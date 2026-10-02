import React from 'react';
import { 
  Clock, 
  Send, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import type { TestData, TestAttempt } from '../../types';
import { QuestionPalette } from './QuestionPalette';
import { ResultModal } from './ResultModal';
import { AudioStickyBar } from '../reader/AudioStickyBar';
import { WordLookupPopup } from '../reader/WordLookupPopup';
import { calculateListeningBand, calculateReadingBand, calculateOverallBand } from '../../db/scoring';
import { localDb } from '../../db/storage';

interface TestWorkspaceProps {
  testData: TestData;
  initialModule?: 'listening' | 'reading' | 'full';
  onFinishedTest?: () => void;
}

export const TestWorkspace: React.FC<TestWorkspaceProps> = ({
  testData,
  initialModule = 'full',
  onFinishedTest,
}) => {
  const [activeModule, setActiveModule] = React.useState<'listening' | 'reading'>(
    initialModule === 'reading' ? 'reading' : 'listening'
  );
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [timeRemainingSec, setTimeRemainingSec] = React.useState(
    initialModule === 'reading' ? 60 * 60 : initialModule === 'listening' ? 40 * 60 : 100 * 60
  );
  const [isStrict, setIsStrict] = React.useState(true);
  const [activeQuestionKey, setActiveQuestionKey] = React.useState('listening_1');
  const [selectedWord, setSelectedWord] = React.useState<{ word: string; pos: { x: number; y: number } } | null>(null);
  const [completedAttempt, setCompletedAttempt] = React.useState<TestAttempt | null>(null);

  const listeningQuestions = testData.listening.sections.flatMap(s =>
    s.questions.map(q => ({ key: `listening_${q.id}`, q, module: 'listening' }))
  );
  const readingQuestions = testData.reading.passages.flatMap(p =>
    p.questions.map(q => ({ key: `reading_${q.id}`, q, module: 'reading' }))
  );

  const allQuestions = [...listeningQuestions, ...readingQuestions];
  const currentModuleQuestions = activeModule === 'listening' ? listeningQuestions : readingQuestions;

  // Timer countdown
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemainingSec(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAnswerChange = (key: string, val: string) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  const handleTextSelection = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 2 && text.length < 30 && !text.includes('\n')) {
      setSelectedWord({
        word: text,
        pos: { x: e.clientX, y: e.clientY },
      });
    }
  };

  const handleSubmitTest = () => {
    let rawListening = 0;
    listeningQuestions.forEach(({ key, q }) => {
      const userAns = answers[key] || '';
      if (q.answers.some(a => a.toLowerCase().trim() === userAns.toLowerCase().trim())) {
        rawListening++;
      }
    });

    let rawReading = 0;
    readingQuestions.forEach(({ key, q }) => {
      const userAns = answers[key] || '';
      if (q.answers.some(a => a.toLowerCase().trim() === userAns.toLowerCase().trim())) {
        rawReading++;
      }
    });

    const bandListening = calculateListeningBand(rawListening);
    const bandReading = calculateReadingBand(rawReading);
    const overall = calculateOverallBand(
      activeModule === 'reading' ? undefined : bandListening,
      activeModule === 'listening' ? undefined : bandReading
    );

    const attempt: TestAttempt = {
      id: 'att-' + Date.now(),
      book: testData.book,
      testNumber: testData.test,
      moduleType: initialModule,
      isStrict,
      rawScoreListening: initialModule !== 'reading' ? rawListening : undefined,
      bandScoreListening: initialModule !== 'reading' ? bandListening : undefined,
      rawScoreReading: initialModule !== 'listening' ? rawReading : undefined,
      bandScoreReading: initialModule !== 'listening' ? bandReading : undefined,
      overallBand: overall,
      timeSpentSec: (initialModule === 'reading' ? 3600 : initialModule === 'listening' ? 1800 : 5400) - timeRemainingSec,
      completedAt: new Date().toISOString(),
      answers,
    };

    localDb.saveAttempt(attempt);
    setCompletedAttempt(attempt);
    if (onFinishedTest) onFinishedTest();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Top Test Header Bar */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="font-semibold text-sm text-slate-900 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              <BookOpen className="w-4 h-4" />
            </span>
            <span>{testData.title || `Cambridge IELTS ${testData.book} — Test ${testData.test}`}</span>
          </div>

          {/* Module switch tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveModule('listening')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeModule === 'listening'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Listening ({listeningQuestions.length} Qs)
            </button>
            <button
              onClick={() => setActiveModule('reading')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeModule === 'reading'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reading ({readingQuestions.length} Qs)
            </button>
          </div>
        </div>

        {/* Timer & Submit */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 font-mono text-xs font-bold text-amber-800 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>{formatTimer(timeRemainingSec)}</span>
          </div>

          <button
            onClick={() => setIsStrict(!isStrict)}
            title="Toggle strict simulated test mode"
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              isStrict
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {isStrict ? 'Strict Mode: ON' : 'Casual Mode'}
          </button>

          <button
            onClick={handleSubmitTest}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" /> Submit Exam
          </button>
        </div>
      </header>

      {/* Split-Screen Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Context/Passage/Audio Source */}
        <div
          onMouseUp={handleTextSelection}
          className="flex-1 border-r border-slate-200 p-8 overflow-y-auto bg-slate-50 relative select-text"
        >
          {activeModule === 'listening' ? (
            <div className="max-w-2xl mx-auto space-y-6">
              <AudioStickyBar
                audioPath={testData.listening.audio_path}
                title={`${testData.title} Official Audio`}
              />

              <div className="space-y-6">
                {testData.listening.sections.map(section => (
                  <div key={section.part} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-900 text-base">{section.title}</h3>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        PDF Page {section.pdf_page}
                      </span>
                    </div>
                    {section.context_text && (
                      <pre className="text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                        {section.context_text}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {testData.reading.passages.map(passage => (
                <div key={passage.passage_num} className="bg-white border border-slate-200 rounded-2xl p-7 shadow-xs">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-base">{passage.title}</h3>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Pages {passage.pdf_page_start}–{passage.pdf_page_end}
                    </span>
                  </div>
                  <div className="prose max-w-none text-slate-700 text-sm leading-relaxed space-y-4">
                    {passage.passage_text?.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hint indicator */}
          <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tip: Highlight any word in the text to instantly look up definition & save to your flashcards deck.</span>
          </div>
        </div>

        {/* Right Pane: Questions & Answer Inputs */}
        <div className="w-[460px] border-l border-slate-200 bg-white flex flex-col justify-between shrink-0 shadow-xs">
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>{activeModule.toUpperCase()} Questions</span>
              <span className="text-slate-400 text-[11px] font-normal">Auto-saved</span>
            </div>

            {currentModuleQuestions.map(({ key, q }) => {
              const currentVal = answers[key] || '';
              const isActive = activeQuestionKey === key;

              return (
                <div
                  key={key}
                  id={key}
                  onClick={() => setActiveQuestionKey(key)}
                  className={`p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {q.id}
                    </span>
                    <p className="text-xs text-slate-800 font-medium leading-snug">{q.prompt}</p>
                  </div>

                  {q.type === 'fill_blank' && (
                    <input
                      type="text"
                      placeholder="Type your answer..."
                      value={currentVal}
                      onChange={e => handleAnswerChange(key, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  )}

                  {q.type === 'mcq' && q.options && (
                    <div className="space-y-1.5">
                      {q.options.map(opt => {
                        const optKey = opt.charAt(0);
                        const isChecked = currentVal === optKey;
                        return (
                          <label
                            key={opt}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs cursor-pointer border transition-colors ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name={key}
                              value={optKey}
                              checked={isChecked}
                              onChange={() => handleAnswerChange(key, optKey)}
                              className="accent-indigo-600 text-indigo-600"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'tfng' && q.options && (
                    <div className="grid grid-cols-3 gap-2">
                      {q.options.map(opt => {
                        const isChecked = currentVal === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleAnswerChange(key, opt)}
                            className={`py-2 px-2 rounded-xl text-[11px] font-semibold transition-all border ${
                              isChecked
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Palette Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <QuestionPalette
              questions={currentModuleQuestions}
              answers={answers}
              activeQuestionKey={activeQuestionKey}
              onSelect={k => {
                setActiveQuestionKey(k);
                document.getElementById(k)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }}
            />
          </div>
        </div>
      </div>

      {/* Dictionary definition popup on text highlight */}
      {selectedWord && (
        <WordLookupPopup
          word={selectedWord.word}
          position={selectedWord.pos}
          onClose={() => setSelectedWord(null)}
        />
      )}

      {/* Completion Modal */}
      {completedAttempt && (
        <ResultModal
          attempt={completedAttempt}
          questions={allQuestions}
          onClose={() => setCompletedAttempt(null)}
          onRetry={() => {
            setCompletedAttempt(null);
            setAnswers({});
            setTimeRemainingSec(90 * 60);
          }}
        />
      )}
    </div>
  );
};
