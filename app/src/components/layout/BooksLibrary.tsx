import React from 'react';
import { BookOpen, Headphones, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { allBooksCatalog } from '../../data/catalog';

interface BooksLibraryProps {
  selectedBook: number;
  onSelectBookAndTest: (book: number, test: number, module: 'full' | 'listening' | 'reading') => void;
}

export const BooksLibrary: React.FC<BooksLibraryProps> = ({
  selectedBook,
  onSelectBookAndTest,
}) => {
  const [filter, setFilter] = React.useState<number | 'all'>('all');

  const displayedBooks = filter === 'all' 
    ? allBooksCatalog 
    : allBooksCatalog.filter(b => b.book === filter);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" /> Cambridge IELTS Books 1–18 Library
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Complete official Cambridge Academic collection with full audio tracks and interactive question workstations.
            </p>
          </div>

          {/* Quick Filter */}
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 px-2">Jump to:</span>
            {[1, 5, 10, 15, 18].map(b => (
              <button
                key={b}
                onClick={() => setFilter(filter === b ? 'all' : b)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filter === b
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Book {b}
              </button>
            ))}
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="px-2 py-1 text-xs text-slate-400 hover:text-slate-700 underline font-medium"
              >
                Show All
              </button>
            )}
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedBooks.map((b) => {
            const isCurrent = selectedBook === b.book;
            return (
              <div
                key={b.book}
                className={`bg-white rounded-2xl border transition-all shadow-xs p-6 flex flex-col justify-between ${
                  isCurrent ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm font-mono flex items-center justify-center border border-indigo-100">
                      B{b.book}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Audio + Tests
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">{b.title}</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    4 Official Tests • 40 Listening Questions • 40 Reading Questions
                  </p>

                  {/* Test selector list */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    {b.availableTests.map((testNum) => (
                      <div
                        key={testNum}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 transition-colors"
                      >
                        <span className="text-xs font-semibold text-slate-700 font-mono">
                          Test {testNum}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectBookAndTest(b.book, testNum, 'listening')}
                            title="Listening Practice"
                            className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-indigo-600 transition-colors"
                          >
                            <Headphones className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectBookAndTest(b.book, testNum, 'reading')}
                            title="Reading Practice"
                            className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-indigo-600 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectBookAndTest(b.book, testNum, 'full')}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                          >
                            Full <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
