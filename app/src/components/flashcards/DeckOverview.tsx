import React from 'react';
import { 
  RotateCw, 
  Check, 
  X, 
  Layers, 
  Sparkles, 
  Trash2, 
  Plus, 
  Volume2
} from 'lucide-react';
import type { Flashcard } from '../../types';
import { localDb } from '../../db/storage';

export const DeckOverview: React.FC = () => {
  const [cards, setCards] = React.useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);

  // New word form
  const [newWord, setNewWord] = React.useState('');
  const [newPhonetic, setNewPhonetic] = React.useState('');
  const [newDef, setNewDef] = React.useState('');
  const [newEx, setNewEx] = React.useState('');

  const reloadCards = () => {
    setCards(localDb.getFlashcards());
  };

  React.useEffect(() => {
    reloadCards();
  }, []);

  const handleReview = (quality: 'again' | 'good' | 'easy') => {
    if (!cards.length) return;
    const currentCard = cards[currentIndex];
    let nextBox = currentCard.boxLevel;
    if (quality === 'again') {
      nextBox = 0;
    } else if (quality === 'good') {
      nextBox = Math.min(5, nextBox + 1);
    } else if (quality === 'easy') {
      nextBox = Math.min(5, nextBox + 2);
    }

    localDb.updateFlashcard(currentCard.id, {
      boxLevel: nextBox,
      nextReviewAt: new Date(Date.now() + nextBox * 86400000 * 2).toISOString().split('T')[0],
    });

    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
      reloadCards();
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord || !newDef) return;
    localDb.saveFlashcard({
      word: newWord,
      phonetic: newPhonetic || undefined,
      definition: newDef,
      exampleSentence: newEx || undefined,
    });
    setNewWord('');
    setNewPhonetic('');
    setNewDef('');
    setNewEx('');
    setShowAddModal(false);
    reloadCards();
  };

  const handleDeleteCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    localDb.deleteFlashcard(id);
    reloadCards();
  };

  const speakWord = (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-GB';
      window.speechSynthesis.speak(u);
    }
  };

  const activeCard = cards[currentIndex];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" /> Spaced Repetition Vocabulary Decks
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Active Leitner Spaced-Repetition System for Cambridge IELTS reading & listening words.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Word
          </button>
        </div>

        {/* Interactive Flashcard Study Mode */}
        {cards.length > 0 && activeCard ? (
          <div className="max-w-lg mx-auto">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-2 px-1">
              <span>Card {currentIndex + 1} of {cards.length}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-semibold">
                Box Level {activeCard.boxLevel}
              </span>
            </div>

            {/* Flashcard container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="min-h-[260px] cursor-pointer rounded-3xl bg-white border border-slate-200 p-8 flex flex-col justify-between shadow-md hover:shadow-xl hover:border-indigo-400 transition-all text-center relative group select-none"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                  {isFlipped ? 'Definition & Context' : 'Academic Term'}
                </span>
                <button
                  onClick={(e) => speakWord(activeCard.word, e)}
                  title="Pronounce"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="my-auto py-6">
                {!isFlipped ? (
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                      {activeCard.word}
                    </h2>
                    {activeCard.phonetic && (
                      <p className="text-sm font-mono text-indigo-600 font-medium">{activeCard.phonetic}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-4 italic">Click card to reveal meaning</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-base text-slate-800 font-medium leading-relaxed">
                      {activeCard.definition}
                    </p>
                    {activeCard.exampleSentence && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        "{activeCard.exampleSentence}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 font-medium">
                <RotateCw className="w-3 h-3 text-slate-400" /> Tap anywhere to flip
              </div>
            </div>

            {/* Answer Ratings buttons */}
            {isFlipped && (
              <div className="grid grid-cols-3 gap-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => handleReview('again')}
                  className="py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <X className="w-3.5 h-3.5" /> Again (Reset)
                </button>
                <button
                  onClick={() => handleReview('good')}
                  className="py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" /> Good (+1 Box)
                </button>
                <button
                  onClick={() => handleReview('easy')}
                  className="py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Easy (+2 Box)
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <p className="text-sm text-slate-500">No cards in your deck yet. Highlight words while reading or add one!</p>
          </div>
        )}

        {/* Word List Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Saved Vocabulary ({cards.length})</h3>
          <div className="divide-y divide-slate-100">
            {cards.map(card => (
              <div key={card.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{card.word}</span>
                    {card.phonetic && <span className="text-xs font-mono text-slate-500">{card.phonetic}</span>}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-indigo-700 border border-slate-200 font-semibold">
                      Box {card.boxLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 truncate">{card.definition}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => speakWord(card.word, e)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteCard(card.id, e)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Add Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Vocabulary Word</h3>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Term / Word *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Disseminate"
                  value={newWord}
                  onChange={e => setNewWord(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phonetic IPA</label>
                <input
                  type="text"
                  placeholder="e.g. /dɪˈsem.ɪ.neɪt/"
                  value={newPhonetic}
                  onChange={e => setNewPhonetic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Definition *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain the academic meaning..."
                  value={newDef}
                  onChange={e => setNewDef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Example Sentence</label>
                <input
                  type="text"
                  placeholder="In a sentence from the passage..."
                  value={newEx}
                  onChange={e => setNewEx(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs text-white font-semibold shadow-xs"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
