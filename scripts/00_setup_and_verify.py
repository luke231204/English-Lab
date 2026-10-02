#!/usr/bin/env python3
"""
RUN ME FIRST — also copies audio files to public/assets/audio structure.

Quick verification test:
  - Verifies Whisper loads correctly
  - Checks Gemini API key works 
  - Tests PDF rendering (renders page 1 of Book 15)
  - Copies all MP3 files to correct public/assets paths
"""
import pathlib
import shutil
import re
import sys
import os

BASE_DIR = pathlib.Path(__file__).parent.parent
APP_AUDIO_DIR = BASE_DIR / "app" / "public" / "assets" / "audio"

def copy_audio_files():
    print("\n=== STEP 1: Copying MP3 files to app/public/assets/audio ===\n")
    for d in sorted(BASE_DIR.iterdir()):
        m = re.match(r"Book (\d+)", d.name)
        if not (m and d.is_dir()):
            continue
        book_num = int(m.group(1))
        book_audio_dir = APP_AUDIO_DIR / f"book{book_num}"
        book_audio_dir.mkdir(parents=True, exist_ok=True)

        for f in d.iterdir():
            if f.suffix.lower() != ".mp3":
                continue
            tm = re.search(r"Listening[_ ]Test[_ ](\d)", f.name, re.IGNORECASE)
            if not tm:
                continue
            test_num = int(tm.group(1))
            dest = book_audio_dir / f"test{test_num}.mp3"
            if dest.exists():
                print(f"  Book {book_num} Test {test_num}: already copied ({dest.name})")
            else:
                print(f"  Book {book_num} Test {test_num}: copying {f.name} -> {dest}")
                shutil.copy2(f, dest)
    print("\n  Audio files ready OK")

def test_whisper():
    print("\n=== STEP 2: Testing Whisper loads ===\n")
    try:
        import whisper
        print("  Whisper module imported OK")
        # Just test load, don't actually download model here
        print("  Note: First transcription will download Whisper 'small' model (~460MB)")
        return True
    except ImportError as e:
        print(f"  ERROR: {e}")
        print("  Run: pip install openai-whisper")
        return False

def test_gemini():
    print("\n=== STEP 3: Testing Gemini API key ===\n")
    try:
        sys.path.insert(0, str(pathlib.Path(__file__).parent))
        from config import GEMINI_API_KEY
        if GEMINI_API_KEY == "PASTE_YOUR_GEMINI_API_KEY_HERE" or not GEMINI_API_KEY:
            print("  WARN No Gemini API key set in scripts/config.py")
            print("  Get a free key at: https://aistudio.google.com/app/apikey")
            return False

        import google.genai as genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        resp = client.models.generate_content(
            model="gemini-3.5-flash",
            contents="Say exactly: IELTS pipeline ready"
        )
        print(f"  Gemini response: {resp.text.strip()}")
        print("  Gemini API key works OK")
        return True
    except FileNotFoundError:
        print("  WARN scripts/config.py not found.")
        print("  Copy config.example.py to config.py and add your key.")
        return False
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

def test_pdf():
    print("\n=== STEP 4: Testing PDF rendering (Book 15 page 1) ===\n")
    try:
        import fitz
        pdf_path = BASE_DIR / "Book 15" / "Cambridge_IELTS_15_Academic_www.ieltsportal.com.pdf"
        if not pdf_path.exists():
            # Try any PDF
            for d in BASE_DIR.iterdir():
                for f in d.iterdir():
                    if f.suffix.lower() == ".pdf":
                        pdf_path = f
                        break
                if pdf_path.exists():
                    break
        doc = fitz.open(str(pdf_path))
        print(f"  PDF: {pdf_path.name}")
        print(f"  Pages: {len(doc)}")
        page = doc[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(150/72, 150/72))
        test_img = BASE_DIR / "scripts" / "_test_page1.png"
        pix.save(str(test_img))
        doc.close()
        print(f"  Page 1 rendered -> {test_img.name} OK")
        return True
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

if __name__ == "__main__":
    print("IELTS Prep Platform — Pipeline Setup Check")
    print("=" * 50)

    copy_audio_files()
    ok_whisper = test_whisper()
    ok_gemini = test_gemini()
    ok_pdf = test_pdf()

    print("\n" + "=" * 50)
    print("RESULTS:")
    print(f"  Whisper: {'OK' if ok_whisper else 'FAIL'}")
    print(f"  Gemini:  {'OK' if ok_gemini else 'FAIL (add key to scripts/config.py)'}")
    print(f"  PDF OCR: {'OK' if ok_pdf else 'FAIL'}")
    print("\nNEXT STEPS:")
    print("  1. python scripts/01_transcribe_audio.py   (Whisper, takes ~30min per book on CPU)")
    print("  2. python scripts/02_extract_questions_gemini.py --start 15 --end 15  (start with Book 15)")
    print("  3. python scripts/03_merge_and_export.py")
    print("\nTip: Start with Book 15 only to verify everything works before processing all 18 books.")
