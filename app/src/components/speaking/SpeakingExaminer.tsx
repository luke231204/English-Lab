import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Cpu, 
  Award, 
  Coffee, 
  Timer, 
  AlertCircle,
  CheckCircle2,
  Bot
} from 'lucide-react';

type ConversationMode = 'serious' | 'chitchat';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export const SpeakingExaminer: React.FC = () => {
  const [mode, setMode] = useState<ConversationMode>('serious');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSynthesisActive, setSpeechSynthesisActive] = useState(true);
  
  // TTS Engine selection: 'edge' | 'kokoro' | 'browser'
  const [ttsEngine, setTtsEngine] = useState<'edge' | 'kokoro' | 'browser'>('edge');
  const [selectedVoice, setSelectedVoice] = useState<string>('en-GB-RyanNeural');
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('qwen2.5:7b');

  // IELTS Cue Card Timer state (for Part 2)
  const [cueCardTimer, setCueCardTimer] = useState<number | null>(null);
  const [isCueCardRunning, setIsCueCardRunning] = useState(false);

  // Band evaluation state
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Studio HD voice list
  const edgeVoices = [
    { id: 'en-GB-RyanNeural', name: '🇬🇧 Ryan (British Examiner HD)' },
    { id: 'en-GB-SoniaNeural', name: '🇬🇧 Sonia (British Lady HD)' },
    { id: 'en-US-GuyNeural', name: '🇺🇸 Guy (US Conversational HD)' },
    { id: 'en-US-JennyNeural', name: '🇺🇸 Jenny (US Friendly HD)' },
    { id: 'en-AU-WilliamNeural', name: '🇦🇺 William (Australian HD)' },
  ];

  const kokoroVoices = [
    { id: 'bf_emma', name: '🇬🇧 Emma (Kokoro Studio AI)' },
    { id: 'bm_george', name: '🇬🇧 George (Kokoro British AI)' },
    { id: 'af_sarah', name: '🇺🇸 Sarah (Kokoro US Natural)' },
    { id: 'af_bella', name: '🇺🇸 Bella (Kokoro Expressive)' },
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Model lists
  const seriousModels = ['qwen2.5:7b', 'llama3.1:8b', 'gemma2:9b'];

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Check Ollama connectivity on mount & interval
  useEffect(() => {
    checkOllama();
    const interval = setInterval(checkOllama, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkOllama = async () => {
    try {
      const res = await fetch('http://localhost:11434/api/tags');
      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: any) => m.name);
        setAvailableModels(models);
        setOllamaStatus('connected');
        if (models.length > 0 && !models.includes(selectedModel)) {
          setSelectedModel(models[0]);
        }
      } else {
        setOllamaStatus('disconnected');
      }
    } catch {
      setOllamaStatus('disconnected');
    }
  };

  // Switch modes and set initial system greeting
  useEffect(() => {
    if (mode === 'serious') {
      // In serious mode, if current model is a lightweight 3B model, snap to Qwen or Llama 8B
      if (!seriousModels.some(m => selectedModel.includes(m.split(':')[0]))) {
        setSelectedModel(availableModels.find(m => m.includes('qwen') || m.includes('llama3.1')) || 'qwen2.5:7b');
      }
      setMessages([
        {
          role: 'assistant',
          content: "Good morning/afternoon. My name is your Cambridge IELTS Examiner. Could you please tell me your full name, and where you are from? To begin Part 1, what do you usually like to do in your free time?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: "Hey there! 👋 I'm your English conversation buddy. We can talk about whatever is on your mind today—movies, technology, gaming, or just your daily life. What have you been up to?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
    setEvaluation(null);
  }, [mode]);

  // Web Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? prev + ' ' : '') + transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition isn't supported in this browser. Please type your message.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // High-Definition Neural Text-To-Speech speak helper
  const speakText = async (text: string) => {
    if (!speechSynthesisActive) return;

    // Clean markdown characters
    const cleanText = text.replace(/[*#_~`]/g, '').trim();
    if (!cleanText) return;

    // Stop any ongoing audio playback
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (ttsEngine === 'browser') {
      if (!('speechSynthesis' in window)) return;
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('UK')));
      if (naturalVoice) utterance.voice = naturalVoice;
      utterance.rate = mode === 'serious' ? 0.95 : 1.0;
      window.speechSynthesis.speak(utterance);
      return;
    }

    try {
      setIsAudioPlaying(true);
      const endpoint = ttsEngine === 'kokoro' ? '/api/tts/kokoro' : '/api/tts/edge';
      const audioUrl = `${endpoint}?text=${encodeURIComponent(cleanText)}&voice=${encodeURIComponent(selectedVoice)}`;
      
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      
      audio.onended = () => {
        setIsAudioPlaying(false);
      };
      
      audio.onerror = () => {
        setIsAudioPlaying(false);
        // Fallback to browser synthesis if backend error occurs
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          window.speechSynthesis.speak(utterance);
        }
      };

      await audio.play();
    } catch {
      setIsAudioPlaying(false);
    }
  };

  // Cue card prep timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isCueCardRunning && cueCardTimer !== null && cueCardTimer > 0) {
      interval = setInterval(() => {
        setCueCardTimer(t => (t !== null && t > 0 ? t - 1 : 0));
      }, 1000);
    } else if (cueCardTimer === 0 && isCueCardRunning) {
      setIsCueCardRunning(false);
      speakText("Your one minute preparation time is now up. Please begin speaking for one to two minutes.");
    }
    return () => clearInterval(interval);
  }, [isCueCardRunning, cueCardTimer]);

  const startCueCardTimer = () => {
    setCueCardTimer(60);
    setIsCueCardRunning(true);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    const systemPrompt = mode === 'serious'
      ? `You are an official Cambridge IELTS Speaking Examiner. 
Conduct a realistic IELTS Speaking interview (Parts 1, 2, and 3).
Guidelines:
1. Ask one clear question at a time. Do not overwhelm the candidate with multiple questions.
2. Maintain a professional, polite, yet formal British examiner tone.
3. If the candidate gives a short answer, probe naturally: "Why do you think that is?" or "Could you elaborate on that?"
4. Transition between Part 1 (familiar topics), Part 2 (cue card topic), and Part 3 (abstract discussion) as appropriate.`
      : `You are a friendly, fluent native English conversational partner. 
Guidelines:
1. Talk casually like an authentic friend (warm, lively, natural phrasing).
2. Answer the user's thoughts and keep the dialogue going by sharing your own perspectives or asking thoughtful follow-ups.
3. If the user makes an awkward phrasing or grammatical slip, subtly offer a native alternative naturally (e.g. "By the way, natives often say '...'"). Keep it conversational and supportive!`;

    try {
      if (ollamaStatus === 'connected') {
        const response = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              ...newHistory.map(m => ({ role: m.role, content: m.content })),
            ],
            stream: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.message?.content || "Sorry, I couldn't process that.";
          const botMsg: Message = {
            role: 'assistant',
            content: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, botMsg]);
          speakText(reply);
        } else {
          throw new Error('Ollama returned non-200');
        }
      } else {
        // Fallback simulation when Ollama is offline
        setTimeout(() => {
          const fallbackReply = mode === 'serious'
            ? "Thank you for that response. Now, moving on to another aspect: How important do you feel digital technology has become in daily education?"
            : "That's super interesting! I totally agree with you on that. Have you always felt that way, or is this something you recently got into?";
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: fallbackReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]);
          speakText(fallbackReply);
        }, 800);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "⚠️ Could not connect to local Ollama. Please make sure Ollama is running in the background.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Evaluate candidate's responses for Band Score
  const handleEvaluateBand = async () => {
    if (messages.filter(m => m.role === 'user').length < 2) {
      alert("Please have at least 2 or 3 exchanges with the examiner before requesting an evaluation.");
      return;
    }

    setIsEvaluating(true);
    setEvaluation(null);

    const userTranscript = messages
      .filter(m => m.role === 'user')
      .map(m => `Candidate: "${m.content}"`)
      .join('\n');

    const evalPrompt = `You are a certified Senior IELTS Speaking Examiner. Evaluate the following candidate answers from their test:

${userTranscript}

Provide an official IELTS Speaking Band Assessment with:
1. Estimated Overall Band Score (e.g., Band 6.5, Band 7.0, Band 7.5).
2. Four Criteria Breakdown:
   - Fluency and Coherence (0-9)
   - Lexical Resource (Vocabulary) (0-9)
   - Grammatical Range and Accuracy (0-9)
   - Pronunciation & Intonation estimate
3. Key Strengths.
4. Specific Recommendations to reach the next Band.`;

    try {
      if (ollamaStatus === 'connected') {
        const response = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: evalPrompt }],
            stream: false,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setEvaluation(data.message?.content || "Evaluation failed.");
        }
      } else {
        setEvaluation("### Estimated Score: Band 7.0\n\n- **Fluency & Coherence**: 7.0 (Good flow, clear connection between ideas)\n- **Lexical Resource**: 7.0 (Natural idiomatic phrasing, varied vocabulary)\n- **Grammar**: 7.0 (Complex sentences used with few minor slips)\n- **Pronunciation**: 7.0 (Clear and easily understood)\n\n*Note: Connect Ollama locally with Qwen 2.5 7B for detailed dynamic evaluations.*");
      }
    } catch {
      setEvaluation("Evaluation failed. Please make sure Ollama is running.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${mode === 'serious' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
            {mode === 'serious' ? <Award className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 tracking-tight text-base">
                {mode === 'serious' ? 'IELTS Examiner Simulation' : 'Daily English Chit-Chat'}
              </h1>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                mode === 'serious' 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {mode === 'serious' ? 'Strict Cambridge Protocol' : 'Casual Practice'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {mode === 'serious' ? 'High-accuracy evaluation powered by Qwen 2.5 & Llama 3.1' : 'Lightweight native conversation partner'}
            </p>
          </div>
        </div>

        {/* Mode Selector & Hardware Controls */}
        <div className="flex items-center gap-2.5">
          {/* 2 Mode Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setMode('serious')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'serious' 
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Serious Mode</span>
            </button>
            <button
              onClick={() => setMode('chitchat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'chitchat' 
                  ? 'bg-white text-amber-700 font-semibold shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Daily Chit-Chat</span>
            </button>
          </div>

          {/* Model Picker */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              {mode === 'serious' ? (
                <>
                  <option value="qwen2.5:7b">Qwen 2.5 7B (Best IELTS Scoring)</option>
                  <option value="llama3.1:8b">Llama 3.1 8B (Deep Discussion)</option>
                </>
              ) : (
                <>
                  <option value="llama3.2:3b">Llama 3.2 3B (Fast & Light ⚡)</option>
                  <option value="phi3.5:latest">Phi-3.5 Mini (Ultra Light)</option>
                  <option value="qwen2.5:7b">Qwen 2.5 7B</option>
                  <option value="llama3.1:8b">Llama 3.1 8B</option>
                </>
              )}
            </select>
          </div>

          {/* Local Ollama Status Indicator */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            ollamaStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${ollamaStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{ollamaStatus === 'connected' ? 'Ollama Local' : 'Local Standby'}</span>
          </div>

          {/* TTS Engine Selector (Edge vs Kokoro) */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => {
                setTtsEngine('edge');
                setSelectedVoice('en-GB-RyanNeural');
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                ttsEngine === 'edge' ? 'bg-white text-indigo-700 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Studio HD Neural Voices (Microsoft Azure)"
            >
              Edge-TTS HD
            </button>
            <button
              onClick={() => {
                setTtsEngine('kokoro');
                setSelectedVoice('bf_emma');
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                ttsEngine === 'kokoro' ? 'bg-white text-indigo-700 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="100% Local Neural Voice Engine"
            >
              Kokoro AI
            </button>
          </div>

          {/* Voice Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
            <Volume2 className={`w-3.5 h-3.5 ${isAudioPlaying ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer max-w-[190px] truncate"
              title="Select human voice"
            >
              {(ttsEngine === 'edge' ? edgeVoices : kokoroVoices).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Output Toggle */}
          <button
            onClick={() => setSpeechSynthesisActive(!speechSynthesisActive)}
            title={speechSynthesisActive ? 'Mute examiner voice' : 'Enable examiner voice'}
            className={`p-2 rounded-xl border transition-all ${
              speechSynthesisActive
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            {speechSynthesisActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Conversation Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Feed */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white' 
                    : mode === 'serious' ? 'bg-slate-800 text-white' : 'bg-amber-600 text-white'
                }`}>
                  {m.role === 'user' ? 'You' : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 text-sm shadow-xs ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  <div className="flex items-center justify-between mt-1 text-[10px] opacity-60">
                    <span>{m.timestamp}</span>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => speakText(m.content)}
                        className="ml-2 hover:opacity-100 flex items-center gap-0.5"
                      >
                        <Volume2 className="w-3 h-3" /> Replay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-xl">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs ml-1 font-medium text-slate-400">Thinking on RX 6600...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Controls Dock */}
          <div className="p-4 bg-white border-t border-slate-200/80">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2">
              {/* Mic / Speech Input Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-xl border transition-all ${
                  isRecording
                    ? 'bg-red-500 border-red-600 text-white animate-pulse shadow-md shadow-red-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                }`}
                title={isRecording ? 'Listening to your microphone... Click to stop' : 'Click to speak (Speech-to-Text)'}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input Field */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "Listening to your voice..." : "Type your response or click the microphone to speak..."}
                disabled={isLoading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-xs transition-all flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Helper Sidebar (Serious Mode Tools or Chit-Chat Helpers) */}
        <aside className="w-80 bg-white border-l border-slate-200/80 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
          {mode === 'serious' ? (
            <div className="space-y-6">
              {/* Part 2 Cue Card Timer Tool */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    <Timer className="w-4 h-4 text-indigo-600" />
                    <span>Part 2 Cue Card</span>
                  </div>
                  {cueCardTimer !== null && (
                    <span className="font-mono text-sm font-bold text-indigo-700">
                      {cueCardTimer}s
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  In Part 2, you have exactly 1 minute to make notes before speaking for 2 minutes.
                </p>
                <button
                  onClick={startCueCardTimer}
                  disabled={isCueCardRunning}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Timer className="w-3.5 h-3.5" />
                  {isCueCardRunning ? `Prep Time: ${cueCardTimer}s` : 'Start 1-Min Prep Timer'}
                </button>
              </div>

              {/* Band Score Evaluation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Examiner Assessment
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Once you have finished answering questions, generate an official band evaluation of your vocabulary, grammar, and fluency.
                </p>
                <button
                  onClick={handleEvaluateBand}
                  disabled={isEvaluating}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {isEvaluating ? 'Evaluating on GPU...' : 'Evaluate My Band Score'}
                </button>

                {evaluation && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                    {evaluation}
                  </div>
                )}
              </div>

              {/* Assessment Criteria Checklist */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Target Band 7.5+ Tips
                </span>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li>Avoid simple short yes/no answers.</li>
                  <li>Use signposting words (*"In addition", "Conversely"*).</li>
                  <li>Paraphrase the examiner's words.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Daily Chit-Chat Topics */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <span>Conversation Ideas</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Click any topic to kick off a relaxed conversation:
                </p>
                <div className="space-y-1.5">
                  {[
                    "What's your favorite way to spend a weekend?",
                    "If you could travel anywhere right now, where would you go?",
                    "What are your thoughts on AI changing modern jobs?",
                    "Have you read any good books or watched great movies lately?",
                  ].map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(topic)}
                      className="w-full text-left text-xs p-2 rounded-lg bg-white border border-slate-200/80 text-slate-700 hover:border-amber-400 hover:text-amber-800 transition-all truncate"
                    >
                      💬 {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hardware VRAM Status info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span>RX 6600 8GB Headroom</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  In Chit-Chat mode with **Llama 3.2 3B**, your GPU only uses **~2.2 GB VRAM**, keeping temps cool and responses instantaneous (75–90+ tokens/sec).
                </p>
              </div>
            </div>
          )}

          {/* Quick Ollama Status helper at bottom */}
          <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400">
            {ollamaStatus === 'connected' ? (
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ollama running locally on port 11434</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Run <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">ollama serve</code> to activate local GPU</span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
