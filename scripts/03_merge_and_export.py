"""
Merge Audio Timestamps + Questions → Final TestData JSON
==========================================================
After running:
  01_transcribe_audio.py   → generates data/generated/audio/*.json
  02_extract_questions_gemini.py → generates data/generated/questions/book*/test*.json

This script merges them into the final format used by the React app:
  app/src/data/generated/tests/book<N>_test<M>.ts

It also generates catalog.ts listing all available tests.
"""

import json
import pathlib
import re
import sys

# Force UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = pathlib.Path(__file__).parent.parent
AUDIO_DIR = BASE_DIR / "app" / "src" / "data" / "generated" / "audio"
QUESTIONS_DIR = BASE_DIR / "app" / "src" / "data" / "generated" / "questions"
TESTS_OUT = BASE_DIR / "app" / "src" / "data" / "generated" / "tests"

# Map book number + test num → audio file asset path (relative to /public/assets/)
def get_audio_asset_path(book_num: int, test_num: int) -> str:
    return f"/assets/audio/book{book_num}/test{test_num}.mp3"

def load_audio_data(book_num: int, test_num: int) -> dict:
    f = AUDIO_DIR / f"book{book_num}_test{test_num}.json"
    if f.exists():
        with open(f) as fp:
            return json.load(fp)
    return None

def load_question_data(book_num: int, test_num: int) -> dict:
    f = QUESTIONS_DIR / f"book{book_num}" / f"test{test_num}.json"
    if f.exists():
        with open(f) as fp:
            return json.load(fp)
    return None

def merge_test(book_num: int, test_num: int) -> dict | None:
    audio = load_audio_data(book_num, test_num)
    questions = load_question_data(book_num, test_num)

    if not questions:
        return None

    audio_path = get_audio_asset_path(book_num, test_num)

    # Enrich listening sections with timestamps from audio transcript
    listening_sections = questions.get("listening", {}).get("sections", [])
    if audio:
        audio_parts = {p["part"]: p for p in audio.get("parts", [])}
        for section in listening_sections:
            part_num = section.get("part")
            if part_num in audio_parts:
                section["start_sec"] = audio_parts[part_num]["start_sec"]
                section["end_sec"] = audio_parts[part_num]["end_sec"]
            else:
                # Fallback estimates if not detected
                fallback = {1: (0, 360), 2: (361, 680), 3: (681, 1040), 4: (1041, 1400)}
                section["start_sec"], section["end_sec"] = fallback.get(part_num, (0, 1800))

    merged = {
        "book": book_num,
        "test": test_num,
        "title": f"Cambridge IELTS {book_num} — Academic Test {test_num}",
        "listening": {
            "audio_path": audio_path,
            "sections": listening_sections
        },
        "reading": questions.get("reading", {"passages": []})
    }

    return merged

def dict_to_ts_const(data: dict, const_name: str) -> str:
    """Convert python dict to TypeScript const string."""
    json_str = json.dumps(data, indent=2, ensure_ascii=False)
    return f"""import type {{ TestData }} from '../../../types';

export const {const_name}: TestData = {json_str};
"""

def process_all():
    TESTS_OUT.mkdir(parents=True, exist_ok=True)

    catalog_entries = []

    for book_num in range(1, 19):
        for test_num in range(1, 5):
            merged = merge_test(book_num, test_num)
            if merged is None:
                continue

            const_name = f"cambridge{book_num}Test{test_num}"
            ts_content = dict_to_ts_const(merged, const_name)

            out_file = TESTS_OUT / f"book{book_num}_test{test_num}.ts"
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(ts_content)

            listen_q = sum(len(s.get("questions", [])) for s in merged["listening"]["sections"])
            read_q = sum(len(p.get("questions", [])) for p in merged["reading"]["passages"])

            catalog_entries.append({
                "book": book_num,
                "test": test_num,
                "const_name": const_name,
                "import_path": f"./generated/tests/book{book_num}_test{test_num}",
                "listening_questions": listen_q,
                "reading_questions": read_q
            })

            print(f"  Book {book_num} Test {test_num}: OK {listen_q}L + {read_q}R questions -> {out_file.name}")

    # Generate the catalog TypeScript file listing all available tests
    catalog_imports = "\n".join(
        f"import {{ {e['const_name']} }} from '{e['import_path']}';"
        for e in catalog_entries
    )

    catalog_map_entries = ",\n  ".join(
        f"'{e['book']}-{e['test']}': {e['const_name']}"
        for e in catalog_entries
    )

    avail_json = json.dumps([
        {"book": e["book"], "test": e["test"], "listeningQs": e["listening_questions"], "readingQs": e["reading_questions"]}
        for e in catalog_entries
    ], indent=2)

    catalog_ts = f"""/**
 * AUTO-GENERATED by scripts/03_merge_and_export.py
 * Do not edit manually — run the pipeline scripts to regenerate.
 */
import type {{ TestData }} from '../types';
{catalog_imports}

export const generatedTestsRepository: Record<string, TestData> = {{
  {catalog_map_entries}
}};

export const availableTests = {avail_json};
"""

    catalog_out = BASE_DIR / "app" / "src" / "data" / "generatedCatalog.ts"
    with open(catalog_out, "w", encoding="utf-8") as f:
        f.write(catalog_ts)

    print(f"\nOK Generated {len(catalog_entries)} test files")
    print(f"OK Catalog written to: {catalog_out}")

if __name__ == "__main__":
    process_all()
