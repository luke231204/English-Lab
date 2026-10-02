"""
IELTS PDF OCR Pipeline — Gemini Vision
=========================================
Reads each scanned Cambridge IELTS Academic PDF page by page,
sends page images to Gemini Vision, and extracts:
  - Test number (1-4)
  - Section: Listening Part 1/2/3/4 or Reading Passage 1/2/3
  - Question numbers, types (fill_blank / mcq / tfng / matching)
  - Question prompts and MCQ options
  - Answer key (where visible)

Output: data/generated/questions/<book>/test<N>.json

SETUP: Set your GEMINI_API_KEY in config.py or as environment variable.
"""

import os
import re
import json
import base64
import pathlib
import sys
import fitz   # PyMuPDF

# Force UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import google.genai as genai

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
BASE_DIR  = pathlib.Path(__file__).parent.parent  # IELTS/ root
DATA_OUT  = BASE_DIR / "app" / "src" / "data" / "generated" / "questions"

# API key: read from config.py or env
try:
    sys.path.insert(0, str(pathlib.Path(__file__).parent))
    from config import GEMINI_API_KEY
except ImportError:
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

if not GEMINI_API_KEY:
    print("ERROR: No GEMINI_API_KEY found.")
    print("Create scripts/config.py with: GEMINI_API_KEY = 'your-key-here'")
    sys.exit(1)

# New google-genai client
CLIENT = genai.Client(api_key=GEMINI_API_KEY)

# Gemini Vision model — use gemini-flash-latest (currently available)
VISION_MODEL = "gemini-flash-latest"

# Pages to skip (covers, copyright, audio scripts, answer keys at end)
# We'll process systematically and let Gemini identify sections
SKIP_BLANK_PAGES = True
MIN_TEXT_TO_PROCESS = 100  # skip pages with almost no content

# ──────────────────────────────────────────────
# BOOK / PDF DISCOVERY
# ──────────────────────────────────────────────
def find_books():
    books = {}
    for d in sorted(BASE_DIR.iterdir()):
        m = re.match(r"Book (\d+)", d.name)
        if m and d.is_dir():
            books[int(m.group(1))] = d
    return books

def find_academic_pdf(book_dir: pathlib.Path, book_num: int):
    """Return path to the Academic PDF (not General Training)."""
    for f in book_dir.iterdir():
        name_lower = f.name.lower()
        if f.suffix.lower() == ".pdf":
            # Prefer Academic explicitly; avoid General Training
            if "general" not in name_lower and "general_training" not in name_lower:
                return f
            # For Book 1-10 (no Academic/General split), just take any PDF
            if book_num <= 10:
                return f
    # Fallback: first PDF found
    for f in book_dir.iterdir():
        if f.suffix.lower() == ".pdf":
            return f
    return None

# ──────────────────────────────────────────────
# GEMINI VISION PAGE ANALYSIS
# ──────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert IELTS test data extractor.
I will give you a scanned image of a page from the Cambridge IELTS Academic textbook.
Extract ALL questions and answer keys from this page in strict JSON format.

For each page, output:
{
  "section": "listening_part_1" | "listening_part_2" | "listening_part_3" | "listening_part_4" 
           | "reading_passage_1" | "reading_passage_2" | "reading_passage_3"
           | "answer_key" | "audio_script" | "cover" | "instructions" | "other",
  "test_number": 1 | 2 | 3 | 4 | null,
  "questions": [
    {
      "id": 1,
      "type": "fill_blank" | "mcq" | "tfng" | "matching" | "sentence_completion" | "summary_completion",
      "prompt": "<exact question text>",
      "options": ["A. ...", "B. ...", "C. ..."],
      "answers": ["<accepted answer>"],
      "notes": "<instruction e.g. Write ONE WORD AND/OR A NUMBER>"
    }
  ],
  "answer_key_entries": [
    {"test_number": 1, "module": "listening", "id": 1, "answers": ["Jamieson"]}
  ],
  "passage_title": "<title if reading passage>",
  "passage_text_excerpt": "<first 300 chars of reading passage text if present>",
  "has_answer_key": false
}

If this is NOT a question page (e.g. it's a reading passage body, audio script, cover, or blank), 
still output valid JSON with section identified and questions: [].

Be very precise. Question IDs are global across the test (1-40 for listening, 1-40 for reading).
Output ONLY valid JSON, nothing else.
"""

def page_to_image_bytes(doc, page_num: int, dpi: int = 150) -> bytes:
    page = doc[page_num]
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat)
    return pix.tobytes("png")

def analyze_page_with_gemini(client, image_bytes: bytes, page_num: int) -> dict:
    import time
    # Active vision models in priority order (500 RPD each):
    FALLBACK_MODELS = [
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3-flash-preview",
        "gemini-flash-latest",
    ]

    contents = [{"role": "user", "parts": [
        {"text": SYSTEM_PROMPT},
        {"text": f"This is page {page_num + 1} of the PDF."},
        {"inline_data": {"mime_type": "image/png", "data": image_bytes}},
    ]}]

    for model in FALLBACK_MODELS:
        for attempt in range(2):
            try:
                response = client.models.generate_content(model=model, contents=contents)
                raw_text = response.text or ""
                text = raw_text.strip()
                if not text:
                    break
                if text.startswith("```"):
                    text = re.sub(r"^```(?:json)?\n?", "", text)
                    text = re.sub(r"\n?```$", "", text)
                result = json.loads(text)
                time.sleep(2.5)  # 2.5s safe pacing
                return result
            except json.JSONDecodeError as e:
                print(f"      JSON parse error on page {page_num + 1}: {e}")
                return {"section": "parse_error", "test_number": None, "questions": []}
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    print(f"      [{model}] rate limit, switching to next model...")
                    time.sleep(2.0)
                    break
                elif "503" in err_str or "UNAVAILABLE" in err_str:
                    time.sleep(3.0)
                    continue
                elif "404" in err_str or "not found" in err_str.lower():
                    break
                else:
                    print(f"      Gemini error page {page_num + 1} [{model}]: {err_str[:100]}")
                    break

    print(f"      Cooldown wait for page {page_num + 1}...")
    time.sleep(15.0)
    return {"section": "api_error", "test_number": None, "questions": []}

# ──────────────────────────────────────────────
# BOOK PROCESSING
# ──────────────────────────────────────────────
def process_book(book_num: int, pdf_path: pathlib.Path, client, book_out_dir: pathlib.Path):
    print(f"\n  Opening: {pdf_path.name}")
    doc = fitz.open(str(pdf_path))
    total_pages = len(doc)
    print(f"  Total pages: {total_pages}")

    # Collect all page results
    all_pages = []
    for page_num in range(total_pages):
        out_page_file = book_out_dir / f"page_{page_num+1:03d}.json"

        if out_page_file.exists():
            print(f"    Page {page_num+1}/{total_pages}: already processed, loading cache")
            with open(out_page_file) as f:
                page_result = json.load(f)
        else:
            print(f"    Page {page_num+1}/{total_pages}: analyzing with Gemini Vision...")
            image_bytes = page_to_image_bytes(doc, page_num, dpi=150)
            page_result = analyze_page_with_gemini(client, image_bytes, page_num)
            page_result["_page_num"] = page_num + 1

            if page_result.get("section") != "api_error":
                with open(out_page_file, "w", encoding="utf-8") as f:
                    json.dump(page_result, f, indent=2, ensure_ascii=False)

        all_pages.append(page_result)
        section = page_result.get("section", "?")
        q_count = len(page_result.get("questions", []))
        print(f"    -> section={section}, questions_found={q_count}")

    doc.close()

    # Aggregate by test number and section
    tests = {}
    for page_data in all_pages:
        test_num = page_data.get("test_number")
        if test_num is None:
            continue

        if test_num not in tests:
            tests[test_num] = {
                "book": book_num,
                "test": test_num,
                "listening": {"sections": []},
                "reading": {"passages": []}
            }

        section = page_data.get("section", "other")
        questions = page_data.get("questions", [])

        if not questions:
            continue

        if section.startswith("listening_part_"):
            part_num = int(section.split("_")[-1])
            # Find or create this part in the listening sections
            existing_parts = [s for s in tests[test_num]["listening"]["sections"] if s.get("part") == part_num]
            if existing_parts:
                # Merge questions
                existing_parts[0]["questions"].extend(questions)
            else:
                tests[test_num]["listening"]["sections"].append({
                    "part": part_num,
                    "title": f"Part {part_num}",
                    "questions": questions
                })

        elif section.startswith("reading_passage_"):
            passage_num = int(section.split("_")[-1])
            existing = [p for p in tests[test_num]["reading"]["passages"] if p.get("passage_num") == passage_num]
            if existing:
                existing[0]["questions"].extend(questions)
            else:
                tests[test_num]["reading"]["passages"].append({
                    "passage_num": passage_num,
                    "title": page_data.get("passage_title", f"Reading Passage {passage_num}"),
                    "passage_text": page_data.get("passage_text_excerpt", ""),
                    "questions": questions
                })

    # Apply answer key entries to questions
    for page_data in all_pages:
        entries = page_data.get("answer_key_entries", [])
        for entry in entries:
            t_num = entry.get("test_number")
            m_type = str(entry.get("module", "listening")).lower()
            qid = entry.get("id")
            answers = entry.get("answers", [])
            if not t_num or not qid or not answers or t_num not in tests:
                continue

            if "listen" in m_type:
                for sec in tests[t_num]["listening"]["sections"]:
                    for q in sec.get("questions", []):
                        if q.get("id") == qid and not q.get("answers"):
                            q["answers"] = answers
            elif "read" in m_type:
                for pas in tests[t_num]["reading"]["passages"]:
                    for q in pas.get("questions", []):
                        if q.get("id") == qid and not q.get("answers"):
                            q["answers"] = answers

    return tests

def deduplicate_questions(questions: list) -> list:
    """Remove duplicate question IDs, keeping first occurrence."""
    seen = set()
    result = []
    for q in questions:
        qid = q.get("id")
        if qid not in seen:
            seen.add(qid)
            result.append(q)
    return sorted(result, key=lambda x: x.get("id", 999))

def process_all(start_book: int = 1, end_book: int = 18):
    DATA_OUT.mkdir(parents=True, exist_ok=True)

    client = CLIENT
    books = find_books()

    print(f"\nGemini Vision PDF Extraction Pipeline")
    print(f"Books to process: {start_book} to {end_book}")
    print(f"Output directory: {DATA_OUT}\n")

    for book_num in range(start_book, end_book + 1):
        if book_num not in books:
            print(f"Book {book_num}: directory not found, skipping")
            continue

        book_dir = books[book_num]
        pdf_path = find_academic_pdf(book_dir, book_num)

        if not pdf_path:
            print(f"Book {book_num}: no PDF found in {book_dir.name}, skipping")
            continue

        is_academic = "general" not in pdf_path.name.lower()
        print(f"\n{'='*60}")
        print(f"Book {book_num}: {pdf_path.name}")
        print(f"  Type: {'Academic' if is_academic else 'General Training'}")

        book_out_dir = DATA_OUT / f"book{book_num}" / "pages"
        book_out_dir.mkdir(parents=True, exist_ok=True)

        tests = process_book(book_num, pdf_path, client, book_out_dir)

        # Save each test as individual file
        for test_num, test_data in tests.items():
            # Deduplicate questions in listening sections
            for section in test_data["listening"]["sections"]:
                section["questions"] = deduplicate_questions(section["questions"])
            for passage in test_data["reading"]["passages"]:
                passage["questions"] = deduplicate_questions(passage["questions"])

            out_file = DATA_OUT / f"book{book_num}" / f"test{test_num}.json"
            out_file.parent.mkdir(parents=True, exist_ok=True)
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(test_data, f, indent=2, ensure_ascii=False)

            listen_q = sum(len(s["questions"]) for s in test_data["listening"]["sections"])
            read_q = sum(len(p["questions"]) for p in test_data["reading"]["passages"])
            print(f"\n  Test {test_num}: saved -> listening={listen_q}Q, reading={read_q}Q")

    print(f"\n\nOK All done. Questions saved to: {DATA_OUT}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Extract IELTS questions from scanned PDFs using Gemini Vision")
    parser.add_argument("--start", type=int, default=15, help="First book to process (default: 15)")
    parser.add_argument("--end", type=int, default=15, help="Last book to process (default: 15)")
    args = parser.parse_args()

    process_all(start_book=args.start, end_book=args.end)
