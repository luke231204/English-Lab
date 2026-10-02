"""
IELTS Audio Transcription Pipeline
====================================
Uses OpenAI Whisper (runs 100% locally, no API key needed)
to transcribe Cambridge IELTS MP3 files and detect:
  - Part/Section boundaries (Part/Section 1, 2, 3, 4)
  - Timestamps for each question section start/end
  - Section titles and audio excerpts

Output: app/src/data/generated/audio/book<N>_test<M>.json
"""

import os
import re
import sys
import json
import pathlib
import argparse
import whisper

# Force UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure ffmpeg from imageio_ffmpeg is in PATH
try:
    import imageio_ffmpeg
    ffmpeg_dir = str(pathlib.Path(imageio_ffmpeg.get_ffmpeg_exe()).parent)
    if ffmpeg_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
except Exception as e:
    pass

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
BASE_DIR   = pathlib.Path(__file__).parent.parent  # IELTS/ root
DATA_OUT   = BASE_DIR / "app" / "src" / "data" / "generated" / "audio"
MODEL_SIZE = "base.en"  # base.en is fast on CPU (~140MB) and highly accurate for English

BOOKS_DIR = BASE_DIR

def find_books():
    books = {}
    for d in sorted(BOOKS_DIR.iterdir()):
        m = re.match(r"Book (\d+)", d.name)
        if m and d.is_dir():
            books[int(m.group(1))] = d
    return books

def find_audio_files(book_dir: pathlib.Path, book_num: int):
    """Return mapping: test_num -> mp3 path"""
    files = {}
    for f in book_dir.iterdir():
        if f.suffix.lower() != ".mp3":
            continue
        m = re.search(r"Listening[_ ]Test[_ ](\d)", f.name, re.IGNORECASE)
        if m:
            test_num = int(m.group(1))
            files[test_num] = f
    return files

def detect_parts_from_segments(segments):
    """
    Scan Whisper segments for 'Part/Section 1/2/3/4' or words 'one/two/three/four'
    Returns list of {part, start_sec, text_excerpt}
    """
    PART_WORDS = {
        "one": 1, "1": 1,
        "two": 2, "2": 2,
        "three": 3, "3": 3,
        "four": 4, "4": 4,
    }

    part_markers = []
    for seg in segments:
        text = seg["text"].strip()
        m = re.search(r"\b(?:part|section)\s+(one|two|three|four|\d)\b", text, re.IGNORECASE)
        if m:
            word = m.group(1).lower()
            part_num = PART_WORDS.get(word)
            if part_num:
                part_markers.append({
                    "part": part_num,
                    "start_sec": seg["start"],
                    "text_excerpt": text[:120]
                })

    # Deduplicate: keep first occurrence of each part number
    seen = set()
    deduped = []
    for p in sorted(part_markers, key=lambda x: x["start_sec"]):
        if p["part"] not in seen:
            seen.add(p["part"])
            deduped.append(p)

    deduped.sort(key=lambda x: x["start_sec"])
    return deduped

def build_part_timestamps(part_markers, total_duration):
    """
    Convert part start markers into {part, start_sec, end_sec} records.
    If some parts are missing, fill reasonable defaults.
    """
    parts = []
    for i, pm in enumerate(part_markers):
        start = pm["start_sec"]
        end = part_markers[i + 1]["start_sec"] if i + 1 < len(part_markers) else total_duration
        parts.append({
            "part": pm["part"],
            "start_sec": round(start, 1),
            "end_sec": round(end, 1),
            "text_excerpt": pm.get("text_excerpt", "")
        })

    # Ensure all 4 parts exist; if any missing, provide fallback split
    found_parts = {p["part"] for p in parts}
    if len(found_parts) < 4:
        print(f"    Warning: detected parts {sorted(list(found_parts))}, filling missing with estimates")
        fallback_splits = {
            1: (0.0, min(total_duration * 0.25, 360.0)),
            2: (min(total_duration * 0.25, 360.0), min(total_duration * 0.50, 720.0)),
            3: (min(total_duration * 0.50, 720.0), min(total_duration * 0.75, 1080.0)),
            4: (min(total_duration * 0.75, 1080.0), total_duration)
        }
        for expected in [1, 2, 3, 4]:
            if expected not in found_parts:
                s, e = fallback_splits[expected]
                parts.append({
                    "part": expected,
                    "start_sec": round(s, 1),
                    "end_sec": round(e, 1),
                    "text_excerpt": f"[Estimated] Part {expected}"
                })
        parts.sort(key=lambda x: x["part"])

    return parts

def transcribe_file(model, mp3_path: pathlib.Path):
    print(f"\n  Transcribing: {mp3_path.name}...")
    result = model.transcribe(
        str(mp3_path),
        verbose=False,
        word_timestamps=False,
        language="en",
        initial_prompt="IELTS Listening Test. Section 1. Section 2. Section 3. Section 4. Part 1. Part 2. Part 3. Part 4."
    )
    return result

def process_books(start_book: int = 15, end_book: int = 15):
    DATA_OUT.mkdir(parents=True, exist_ok=True)

    print(f"Loading Whisper '{MODEL_SIZE}' model...")
    model = whisper.load_model(MODEL_SIZE)
    print("Model loaded OK")

    books = find_books()
    print(f"Processing books {start_book} to {end_book}")

    all_results = {}

    for book_num in range(start_book, end_book + 1):
        if book_num not in books:
            print(f"\n  Book {book_num}: not found, skipping")
            continue

        book_dir = books[book_num]
        audio_files = find_audio_files(book_dir, book_num)

        if not audio_files:
            print(f"\n  Book {book_num}: no audio files found, skipping")
            continue

        print(f"\n=== Book {book_num} === ({len(audio_files)} audio files)")
        book_results = {}

        for test_num in sorted(audio_files.keys()):
            mp3_path = audio_files[test_num]
            out_path = DATA_OUT / f"book{book_num}_test{test_num}.json"

            if out_path.exists():
                print(f"  Test {test_num}: already processed, skipping ({out_path.name})")
                with open(out_path, encoding="utf-8") as f:
                    book_results[test_num] = json.load(f)
                continue

            result = transcribe_file(model, mp3_path)

            total_duration = result["segments"][-1]["end"] if result["segments"] else 0
            part_markers = detect_parts_from_segments(result["segments"])
            part_timestamps = build_part_timestamps(part_markers, total_duration)

            transcript_text = result["text"]

            output = {
                "book": book_num,
                "test": test_num,
                "audio_file": mp3_path.name,
                "total_duration_sec": round(total_duration, 1),
                "parts": part_timestamps,
                "full_transcript_excerpt": transcript_text[:2000],
            }

            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(output, f, indent=2, ensure_ascii=False)

            print(f"  Test {test_num}: OK detected {len(part_timestamps)} parts -> {out_path.name}")
            for p in part_timestamps:
                mm_s = int(p['start_sec'] // 60)
                ss_s = int(p['start_sec'] % 60)
                mm_e = int(p['end_sec'] // 60)
                ss_e = int(p['end_sec'] % 60)
                print(f"    Part {p['part']}: {mm_s}:{ss_s:02d} -> {mm_e}:{ss_e:02d}")

            book_results[test_num] = output

        all_results[book_num] = book_results

    print(f"\nAll audio transcription complete! Transcripts in {DATA_OUT}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transcribe IELTS listening audio with Whisper")
    parser.add_argument("--start", type=int, default=15, help="First book to transcribe (default: 15)")
    parser.add_argument("--end", type=int, default=15, help="Last book to transcribe (default: 15)")
    args = parser.parse_args()

    process_books(start_book=args.start, end_book=args.end)
