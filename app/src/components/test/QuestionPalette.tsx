import React from 'react';
import type { Question } from '../../types';

interface QuestionPaletteProps {
  questions: { key: string; q: Question; module: string }[];
  answers: Record<string, string>;
  activeQuestionKey: string;
  onSelect: (key: string) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  answers,
  activeQuestionKey,
  onSelect,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
        <span>Question Palette</span>
        <span className="font-mono text-indigo-600 font-bold">
          {Object.keys(answers).filter(k => answers[k]?.trim()).length}/{questions.length} answered
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {questions.map(({ key, q }) => {
          const isAnswered = !!answers[key]?.trim();
          const isActive = activeQuestionKey === key;

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`h-8 rounded-lg text-xs font-semibold font-mono transition-all flex items-center justify-center border ${
                isActive
                  ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-600 text-white font-bold'
                  : isAnswered
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white'
              }`}
            >
              {q.id}
            </button>
          );
        })}
      </div>
    </div>
  );
};
