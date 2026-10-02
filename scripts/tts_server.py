"""
Local HD Neural TTS Server for IELTS Speaking Practice
======================================================
Provides:
  1. Edge-TTS Studio HD voices (en-GB-RyanNeural, en-GB-SoniaNeural, en-US-GuyNeural, en-US-JennyNeural)
  2. Kokoro Local Neural voices (bf_emma, bm_george, af_sarah, af_bella)

Listens on: http://localhost:5005
"""

import asyncio
import io
import json
import os
import sys
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

# Force UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import edge_tts

# Optional Kokoro import
KOKORO_PIPELINE = None

def get_kokoro_pipeline():
    global KOKORO_PIPELINE
    if KOKORO_PIPELINE is None:
        try:
            from kokoro import KPipeline
            # British English pipeline 'b', or American 'a'
            KOKORO_PIPELINE = {
                'b': KPipeline(lang_code='b'),
                'a': KPipeline(lang_code='a')
            }
        except Exception as e:
            print(f"[Kokoro Init Error]: {e}")
    return KOKORO_PIPELINE

class TTSHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        path = parsed.path

        if path == "/api/tts/voices":
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            voices = {
                "edge": [
                    {"id": "en-GB-RyanNeural", "name": "🇬🇧 Ryan (British Examiner HD)", "lang": "en-GB"},
                    {"id": "en-GB-SoniaNeural", "name": "🇬🇧 Sonia (British Lady HD)", "lang": "en-GB"},
                    {"id": "en-US-GuyNeural", "name": "🇺🇸 Guy (US Conversational HD)", "lang": "en-US"},
                    {"id": "en-US-JennyNeural", "name": "🇺🇸 Jenny (US Friendly HD)", "lang": "en-US"},
                    {"id": "en-AU-WilliamNeural", "name": "🇦🇺 William (Australian HD)", "lang": "en-AU"}
                ],
                "kokoro": [
                    {"id": "bf_emma", "name": "🇬🇧 Emma (Kokoro Studio AI)", "lang": "en-GB"},
                    {"id": "bm_george", "name": "🇬🇧 George (Kokoro British AI)", "lang": "en-GB"},
                    {"id": "af_sarah", "name": "🇺🇸 Sarah (Kokoro US Natural)", "lang": "en-US"},
                    {"id": "af_bella", "name": "🇺🇸 Bella (Kokoro Expressive)", "lang": "en-US"}
                ]
            }
            self.wfile.write(json.dumps(voices).encode("utf-8"))
            return

        text = params.get("text", [""])[0]
        voice = params.get("voice", ["en-GB-RyanNeural"])[0]

        if not text:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Missing 'text' parameter")
            return

        if path == "/api/tts/edge":
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                communicate = edge_tts.Communicate(text, voice)
                audio_data = loop.run_until_complete(self._collect_edge_audio(communicate))
                loop.close()

                self.send_response(200)
                self.send_header('Content-Type', 'audio/mpeg')
                self.send_header('Content-Length', str(len(audio_data)))
                self.end_headers()
                self.wfile.write(audio_data)
                return
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f"Edge-TTS Error: {e}".encode("utf-8"))
                return

        elif path == "/api/tts/kokoro":
            try:
                import soundfile as sf
                import numpy as np

                lang_code = 'b' if voice.startswith('b') else 'a'
                pipelines = get_kokoro_pipeline()
                if not pipelines or lang_code not in pipelines:
                    raise RuntimeError("Kokoro pipeline could not be initialized")

                pipeline = pipelines[lang_code]
                generator = pipeline(text, voice=voice, speed=1.0, split_pattern=r'\n+')
                
                all_audio = []
                for _, _, audio in generator:
                    all_audio.append(audio)

                if not all_audio:
                    raise RuntimeError("Kokoro did not generate any audio chunks")

                full_audio = np.concatenate(all_audio)
                out_buf = io.BytesIO()
                sf.write(out_buf, full_audio, 24000, format='WAV')
                audio_bytes = out_buf.getvalue()

                self.send_response(200)
                self.send_header('Content-Type', 'audio/wav')
                self.send_header('Content-Length', str(len(audio_bytes)))
                self.end_headers()
                self.wfile.write(audio_bytes)
                return
            except Exception as e:
                traceback.print_exc()
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f"Kokoro Error: {e}".encode("utf-8"))
                return

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/stt":
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                audio_bytes = self.rfile.read(content_length)

                if not audio_bytes:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b"No audio data received")
                    return

                content_type = self.headers.get('Content-Type', 'audio/webm')
                suffix = ".ogg" if "ogg" in content_type else ".wav" if "wav" in content_type else ".webm"
                
                # Ensure imageio-ffmpeg is on PATH for whisper
                try:
                    import imageio_ffmpeg
                    ffmpeg_dir = os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())
                    if ffmpeg_dir not in os.environ.get("PATH", ""):
                        os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ["PATH"]
                except ImportError:
                    pass

                import tempfile
                import whisper

                with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                    tmp.write(audio_bytes)
                    tmp_path = tmp.name

                try:
                    global WHISPER_MODEL
                    if 'WHISPER_MODEL' not in globals() or WHISPER_MODEL is None:
                        print("[*] Loading Whisper small.en model into memory...")
                        WHISPER_MODEL = whisper.load_model("small.en")

                    # Use initial_prompt to prime Whisper for ESL/IELTS conversational English vocabulary
                    initial_prompt = (
                        "IELTS Speaking test conversation. The speaker is talking in English about "
                        "daily life, technology, society, education, work, and personal experiences."
                    )
                    result = WHISPER_MODEL.transcribe(
                        tmp_path, 
                        fp16=False, 
                        language="en",
                        initial_prompt=initial_prompt,
                        temperature=0.0
                    )
                    transcribed_text = result.get("text", "").strip()
                    print(f"[*] [Whisper small.en STT]: '{transcribed_text}' ({len(audio_bytes)} bytes, format {suffix})")
                finally:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"text": transcribed_text}).encode("utf-8"))
                return
            except Exception as e:
                traceback.print_exc()
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
                return

        self.send_response(404)
        self.end_headers()

    async def _collect_edge_audio(self, communicate):
        chunks = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                chunks.append(chunk["data"])
        return b"".join(chunks)

def run_server(port=5005):
    server = HTTPServer(('127.0.0.1', port), TTSHandler)
    print(f"[*] IELTS Neural Voice & STT Server running on http://127.0.0.1:{port}")
    server.serve_forever()

if __name__ == "__main__":
    run_server()

