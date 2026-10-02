import React from 'react';
import { 
  Play, 
  Headphones, 
  FileText, 
  Layers, 
  Sparkles, 
  Clock, 
  Award,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Library
} from 'lucide-react';
import { localDb } from '../../db/storage';

interface DashboardProps {
  onStartExam: (module: 'full' | 'listening' | 'reading', book?: number, test?: number) => void;
  onOpenDeck: () => void;
  onOpenAnalytics: () => void;
  onOpenBooks: () => void;
  currentBook: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onStartExam,
  onOpenDeck,
  onOpenAnalytics,
  onOpenBooks,
  currentBook,
}) => {
  const attempts = localDb.getAttempts();
  const flashcards = localDb.getFlashcards();
  const latestAttempt = attempts[0];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Clean White Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-8 shadow-sm">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cambridge IELTS Official Academic Series 1–18</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Interactive IELTS on Computer Practice System
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Full offline computer test simulation with synced listening audio, reading passages, instant dictionary lookup popups, strict timer, and automated band score calculation.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => onStartExam('full', currentBook, 1)}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" /> Start Full Mock (Book {currentBook} Test 1)
              </button>
              <button
                onClick={() => onStartExam('listening', currentBook, 1)}
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm flex items-center gap-2 transition-colors shadow-xs"
              >
                <Headphones className="w-4 h-4 text-indigo-600" /> Listening
              </button>
              <button
                onClick={() => onStartExam('reading', currentBook, 1)}
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm flex items-center gap-2 transition-colors shadow-xs"
              >
                <FileText className="w-4 h-4 text-amber-600" /> Reading
              </button>
              <button
                onClick={onOpenBooks}
                className="px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm flex items-center gap-1.5 transition-colors border border-indigo-200"
              >
                <Library className="w-4 h-4" /> Browse All Books (1–18)
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-5">
          <div
            onClick={onOpenAnalytics}
            className="cursor-pointer bg-white border border-slate-200/80 hover:border-indigo-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-3">
              <span>Latest Band Score</span>
              <Award className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {latestAttempt ? latestAttempt.overallBand.toFixed(1) : '7.5'}
            </div>
            <p className="text-xs mt-2 flex items-center gap-1 text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> High accuracy streak
            </p>
          </div>

          <div
            onClick={onOpenDeck}
            className="cursor-pointer bg-white border border-slate-200/80 hover:border-indigo-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-3">
              <span>Vocabulary Deck</span>
              <Layers className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">{flashcards.length} Words</div>
            <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" /> Leitner spaced repetition ready
            </p>
          </div>

          <div
            onClick={onOpenBooks}
            className="cursor-pointer bg-white border border-slate-200/80 hover:border-indigo-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-3">
              <span>Cambridge Library</span>
              <Bookmark className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">18 Books</div>
            <p className="text-xs text-slate-500 mt-2">Books 1 through 18 active</p>
          </div>
        </div>

        {/* Selected Book Practice Tests */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cambridge IELTS {currentBook} Practice Tests</h3>
              <p className="text-xs text-slate-500 mt-0.5">Select a test module below to start practice</p>
            </div>
            <button
              onClick={onOpenBooks}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Change Book <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4].map(testNum => (
              <div
                key={testNum}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-indigo-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center font-bold text-sm font-mono shadow-xs">
                    T{testNum}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      Cambridge IELTS {currentBook} — Academic Test {testNum}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Listening Audio Sections • Reading Passages • Automated Band Grading
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStartExam('listening', currentBook, testNum)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 font-medium transition-colors shadow-xs"
                  >
                    Listening
                  </button>
                  <button
                    onClick={() => onStartExam('reading', currentBook, testNum)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 font-medium transition-colors shadow-xs"
                  >
                    Reading
                  </button>
                  <button
                    onClick={() => onStartExam('full', currentBook, testNum)}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs text-white font-semibold flex items-center gap-1 shadow-xs transition-all"
                  >
                    Full Test <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
