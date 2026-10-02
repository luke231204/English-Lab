import React from 'react';
import { Award, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { TestAttempt, Question } from '../../types';

interface ResultModalProps {
  attempt: TestAttempt;
  questions: { key: string; q: Question; module: string }[];
  onClose: () => void;
  onRetry: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  attempt,
  questions,
  onClose,
  onRetry,
}) => {
  React.useEffect(() => {
    if (attempt.overallBand >= 6.5) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [attempt.overallBand]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-8 shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-3">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Test Completed!</h2>
          <p className="text-xs text-slate-500 mt-1">
            Cambridge IELTS {attempt.book} — Test {attempt.testNumber} ({attempt.moduleType.toUpperCase()})
          </p>
        </div>

        {/* Scores Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Overall Band
            </span>
            <span className="text-4xl font-extrabold text-indigo-600 font-mono">
              {attempt.overallBand.toFixed(1)}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Listening
            </span>
            <span className="text-xl font-bold text-slate-800 font-mono">
              {attempt.bandScoreListening !== undefined ? `${attempt.bandScoreListening.toFixed(1)} Band` : 'N/A'}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {attempt.rawScoreListening !== undefined ? `${attempt.rawScoreListening} correct` : ''}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Reading
            </span>
            <span className="text-xl font-bold text-slate-800 font-mono">
              {attempt.bandScoreReading !== undefined ? `${attempt.bandScoreReading.toFixed(1)} Band` : 'N/A'}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {attempt.rawScoreReading !== undefined ? `${attempt.rawScoreReading} correct` : ''}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-500 mb-4 flex justify-between items-center px-1">
          <span>Time elapsed: <strong className="text-slate-800 font-mono">{formatTime(attempt.timeSpentSec)}</strong></span>
          <span>Evaluation mode: <strong className="text-slate-800">{attempt.isStrict ? 'Strict Exam' : 'Casual Practice'}</strong></span>
        </div>

        {/* Detailed Answer Review Breakdown */}
        <div className="border border-slate-200 rounded-2xl bg-slate-50/60 p-4 max-h-64 overflow-y-auto mb-6 space-y-2">
          <div className="text-xs font-semibold text-slate-700 mb-2">Answer Breakdown:</div>
          {questions.map(({ key, q }) => {
            const userAns = attempt.answers[key] || '';
            const isCorrect = q.answers.some(a => a.toLowerCase().trim() === userAns.toLowerCase().trim());

            return (
              <div
                key={key}
                className="flex items-start justify-between gap-3 text-xs p-3 rounded-xl bg-white border border-slate-200 shadow-xs"
              >
                <div className="flex items-start gap-2.5">
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-800">
                      Q{q.id}: {q.prompt}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Your answer: <span className={isCorrect ? 'text-emerald-700 font-medium' : 'text-rose-600 line-through'}>{userAns || '(Empty)'}</span>
                    </div>
                  </div>
                </div>
                {!isCorrect && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Accepted</span>
                    <span className="text-emerald-600 font-semibold font-mono">{q.answers.join(' / ')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onRetry}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry Test
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-colors"
          >
            Done & View Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
