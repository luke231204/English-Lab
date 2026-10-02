# 🎓 English Lab — Cambridge IELTS Academic Suite & AI Voice Examiner

A modern, full-stack Cambridge IELTS preparation platform built with React, Vite, Tailwind CSS, Python, and local open-weights LLMs via Ollama.

---

## 🌟 Key Features

### 1. 📚 Comprehensive Cambridge IELTS (Books 1–18)
- Complete question banks for **Listening** (Parts 1–4) and **Reading** (Passages 1–3).
- Scanned PDF question extraction powered by **Gemini Multimodal Vision**.
- Precise Whisper audio transcript alignment with sub-second timestamps for each listening section.
- Anti-interception audio streaming backend that prevents download managers from breaking playback.

### 2. 🎙️ AI Speaking & Conversation Practice
- **🎓 Serious Mode (IELTS Examiner)**:
  - Official Cambridge IELTS interview protocol (Parts 1, 2, and 3).
  - Built-in **1-Minute Cue Card Preparation Timer** for Part 2 long turns.
  - One-click **Band Score Evaluation** assessing *Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, and Pronunciation*.
  - Powered by high-accuracy models: **Qwen 2.5 7B** and **Llama 3.1 8B**.
- **☕ Daily Chit-Chat Mode (Casual English Partner)**:
  - Relaxed, fluid native conversation partner.
  - Subtle, friendly grammar and idiomatic corrections.
  - Powered by ultra-lightweight, blazing-fast models: **Llama 3.2 3B** (~79 tokens/sec) and **Phi-3.5 Mini**.

### 3. 🔊 Studio-Quality Neural Voices (Zero Robotic Sound)
- **Edge-TTS Studio HD**: Stream broadcast-quality British and American human voices (e.g. *Ryan British Examiner, Sonia British Lady, Guy US, Jenny US*).
- **Kokoro Local AI**: 100% offline generative neural speech (82M params) with natural pauses, breathing, and pitch dynamics (*Emma, George, Sarah, Bella*).
- **Speech-to-Text**: Zero-token native browser speech recognition.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **AI Brain**: Local open-weights LLMs via [Ollama](https://ollama.com/) (`qwen2.5:7b`, `llama3.1:8b`, `llama3.2:3b`)
- **Speech Synthesis**: Edge-TTS & Kokoro TTS Python backend (`http://localhost:5005`)
- **Data Pipelines**: Python, PyMuPDF, Whisper (`base.en`), Google GenAI

---

## 🚀 Quick Start

### 1. Clone & Install Frontend
```bash
git clone https://github.com/luke231204/English-Lab.git
cd English-Lab/app
npm install
npm run dev
```

### 2. Run Local LLM (Ollama)
```bash
# Pull recommended models
ollama pull llama3.2:3b    # Fast Daily Chit-Chat
ollama pull qwen2.5:7b      # High-accuracy IELTS Examiner
ollama pull llama3.1:8b     # Natural Deep Discussion
```

### 3. Start Neural Voice Server
```bash
pip install edge-tts kokoro soundfile numpy
python scripts/tts_server.py
```

---

## 🔒 Privacy & Security
All sensitive configuration files (API keys, `.env`, `scripts/config.py`) and raw copyrighted scanned PDFs/audio are strictly ignored in `.gitignore`.
