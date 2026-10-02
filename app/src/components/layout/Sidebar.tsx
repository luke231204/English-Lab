import React from 'react';
import { 
  BookOpen, 
  Headphones, 
  FileText, 
  Sparkles, 
  BarChart3, 
  Layers, 
  Clock,
  Compass,
  Library,
  Mic
} from 'lucide-react';

interface SidebarProps {
  currentTab: 'dashboard' | 'test' | 'reading' | 'listening' | 'speaking' | 'flashcards' | 'analytics' | 'books';
  onSelectTab: (tab: 'dashboard' | 'test' | 'reading' | 'listening' | 'speaking' | 'flashcards' | 'analytics' | 'books') => void;
  selectedBook: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, selectedBook }) => {
  const navItems: { id: typeof currentTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass, badge: 'Hub' },
    { id: 'books', label: 'Books 1–18 Library', icon: Library, badge: 'All' },
    { id: 'test', label: 'Mock Exam (Full)', icon: Clock, badge: `Book ${selectedBook}` },
    { id: 'speaking', label: 'Speaking & Chit-Chat', icon: Mic, badge: 'AI Voice' },
    { id: 'listening', label: 'Listening Practice', icon: Headphones },
    { id: 'reading', label: 'Reading Passages', icon: FileText },
    { id: 'flashcards', label: 'Vocabulary Decks', icon: Layers, badge: 'Leitner' },
    { id: 'analytics', label: 'Progress & Bands', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen shrink-0 select-none shadow-sm">
      <div>
        {/* App Branding */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight">IELTS Master</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Cambridge Academic Suite</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Study Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs border border-indigo-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Target Band Card */}
      <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-slate-50 border border-indigo-100/80">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
          <span className="font-medium">Target Band Score</span>
          <span className="text-indigo-600 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> 8.0
          </span>
        </div>
        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
          <div className="bg-indigo-600 h-full w-[85%] rounded-full" />
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
          <span>Active Book: <strong className="text-slate-800 font-semibold">Book {selectedBook}</strong></span>
          <span className="text-emerald-600 font-semibold">Ready</span>
        </div>
      </div>
    </aside>
  );
};
