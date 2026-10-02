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
from socketserver import ThreadingMixIn
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

                params = urllib.parse.parse_qs(parsed.query)
                provider = params.get('provider', ['groq'])[0].lower()

                content_type = self.headers.get('Content-Type', 'audio/webm')
                suffix = ".ogg" if "ogg" in content_type else ".wav" if "wav" in content_type else ".webm"
                transcribed_text = ""

                # --- Provider 1: Groq Cloud (Ultra-Fast Whisper Turbo, ~150ms) ---
                if provider == "groq":
                    try:
                        groq_key = os.environ.get("GROQ_API_KEY", "")
                        if not groq_key:
                            try:
                                from config import GROQ_API_KEY
                                groq_key = GROQ_API_KEY
                            except ImportError:
                                pass

                        if not groq_key:
                            raise ValueError("GROQ_API_KEY not configured in config.py")

                        import uuid
                        boundary = '----WebKitFormBoundary' + uuid.uuid4().hex
                        parts = [
                            b'--' + boundary.encode() + b'\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3-turbo\r\n',
                            b'--' + boundary.encode() + f'\r\nContent-Disposition: form-data; name="file"; filename="audio{suffix}"\r\nContent-Type: {content_type}\r\n\r\n'.encode('utf-8') + audio_bytes + b'\r\n',
                            b'--' + boundary.encode() + b'--\r\n'
                        ]
                        body = b''.join(parts)

                        req = urllib.request.Request(
                            'https://api.groq.com/openai/v1/audio/transcriptions',
                            data=body,
                            headers={
                                'Authorization': f'Bearer {groq_key}',
                                'Content-Type': f'multipart/form-data; boundary={boundary}',
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                            }
                        )
                        with urllib.request.urlopen(req, timeout=12) as resp:
                            res_data = json.loads(resp.read().decode('utf-8'))
                            transcribed_text = res_data.get('text', '').strip()
                            print(f"[*] [Groq Whisper-Turbo STT]: '{transcribed_text}'")
                    except Exception as ge:
                        print(f"[!] Groq STT failed: {ge}, falling back...")
                        traceback.print_exc()

                # --- Provider 2: Gemini Cloud (Google AI Studio Multimodal Speech) ---
                elif provider == "gemini":
                    try:
                        gemini_key = os.environ.get("GEMINI_API_KEY", "")
                        if not gemini_key:
                            try:
                                from config import GEMINI_API_KEY
                                gemini_key = GEMINI_API_KEY
                            except ImportError:
                                pass

                        if not gemini_key:
                            raise ValueError("GEMINI_API_KEY not configured in config.py")

                        from google import genai
                        client = genai.Client(api_key=gemini_key)
                        prompt = (
                            "Transcribe verbatim only the spoken English words in this audio recording. "
                            "Do not add any explanation, commentary, punctuation analysis, or labels. "
                            "If the audio is silent or unintelligible noise, reply with an empty string."
                        )
                        resp = client.models.generate_content(
                            model='gemini-3.5-flash-lite',
                            contents=[
                                genai.types.Part.from_bytes(data=audio_bytes, mime_type=content_type),
                                prompt
                            ]
                        )
                        raw_text = resp.text or ""
                        # Filter out 'None' or empty responses
                        if raw_text.strip().lower() not in ["none", "empty", "no speech", "silence", ""]:
                            transcribed_text = raw_text.strip()
                        print(f"[*] [Gemini 3.5 Flash STT]: '{transcribed_text}'")
                    except Exception as gme:
                        print(f"[!] Gemini STT failed: {gme}, falling back...")
                        traceback.print_exc()

                # --- Provider 3: Moonshine (Ultra-Fast Local, No Hallucinations) ---
                elif provider == "moonshine":
                    import tempfile
                    import subprocess
                    import imageio_ffmpeg

                    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as raw_tmp:
                        raw_tmp.write(audio_bytes)
                        raw_path = raw_tmp.name

                    wav_path = raw_path + ".converted.wav"
                    try:
                        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
                        # Convert any browser audio (webm/opus/ogg) to clean 16kHz 16-bit mono PCM WAV
                        cmd = [
                            ffmpeg_exe, "-y", "-i", raw_path,
                            "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le",
                            wav_path
                        ]
                        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

                        os.environ['KERAS_BACKEND'] = 'torch'
                        import moonshine
                        res = moonshine.transcribe(wav_path, 'moonshine/base')
                        if res and len(res) > 0 and res[0]:
                            transcribed_text = str(res[0]).strip()
                        print(f"[*] [Moonshine Base STT]: '{transcribed_text}'")
                    except Exception as me:
                        print(f"[!] Moonshine STT failed: {me}")
                        traceback.print_exc()
                    finally:
                        if os.path.exists(raw_path):
                            os.remove(raw_path)
                        if os.path.exists(wav_path):
                            os.remove(wav_path)

                # --- Provider 4: Local Whisper (base.en fallback) ---
                if not transcribed_text and provider == "local":
                    # Ensure imageio-ffmpeg is on PATH for whisper
                    try:
                        import imageio_ffmpeg
                        ffmpeg_dir = os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())
                        if ffmpeg_dir not in os.environ.get("PATH", ""):
                            os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ["PATH"]
                    except ImportError:
                        pass

                    import tempfile
                    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                        tmp.write(audio_bytes)
                        tmp_path = tmp.name

                    try:
                        import whisper as _whisper_module
                        global WHISPER_MODEL
                        if WHISPER_MODEL is None:
                            print("[*] Loading Local Whisper base.en model into memory...")
                            WHISPER_MODEL = _whisper_module.load_model("base.en")

                        import torch
                        torch.set_num_threads(os.cpu_count() or 4)

                        result = WHISPER_MODEL.transcribe(
                            tmp_path, 
                            fp16=False, 
                            language="en",
                            temperature=0.0,
                            beam_size=1,
                            best_of=1,
                            without_timestamps=True,
                            condition_on_previous_text=False,
                            no_speech_threshold=0.6,
                            logprob_threshold=-1.0,
                            compression_ratio_threshold=2.4
                        )
                        transcribed_text = result.get("text", "").strip()
                        print(f"[*] [Local Whisper STT]: '{transcribed_text}' ({len(audio_bytes)} bytes)")
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

# Global model reference for local fallback
WHISPER_MODEL = None

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    """Threaded HTTP server so TTS and STT never block each other."""
    daemon_threads = True

def run_server(port=5005):
    server = ThreadingHTTPServer(('127.0.0.1', port), TTSHandler)
    print(f"[*] IELTS Voice & Multi-Provider STT Server running on http://127.0.0.1:{port}")
    print("    - Groq Whisper-Turbo (Instant)")
    print("    - Gemini 3.5 Transcribe (Google AI)")
    print("    - Local Whisper (base.en fallback)")
    server.serve_forever()

if __name__ == "__main__":
    run_server()

