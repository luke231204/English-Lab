import React from 'react';
import { Sparkles, Plus, Check } from 'lucide-react';
import { localDb } from '../../db/storage';

interface WordLookupPopupProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
  onAddedFlashcard?: () => void;
}

export const WordLookupPopup: React.FC<WordLookupPopupProps> = ({
  word,
  position,
  onClose,
  onAddedFlashcard,
}) => {
  const [loading, setLoading] = React.useState(true);
  const [definition, setDefinition] = React.useState<string | null>(null);
  const [phonetic, setPhonetic] = React.useState<string | null>(null);
  const [partOfSpeech, setPartOfSpeech] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    let isCancelled = false;
    const cleanWord = word.trim().replace(/[^a-zA-Z]/g, '').toLowerCase();

    if (!cleanWord) {
      onClose();
      return;
    }

    setLoading(true);
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`)
      .then(res => res.json())
      .then(data => {
        if (isCancelled) return;
        if (Array.isArray(data) && data[0]) {
          const entry = data[0];
          setPhonetic(entry.phonetic || (entry.phonetics?.[0]?.text ?? ''));
          const meaning = entry.meanings?.[0];
          setPartOfSpeech(meaning?.partOfSpeech || '');
          setDefinition(meaning?.definitions?.[0]?.definition || 'Definition not found.');
        } else {
          setDefinition(`No quick dictionary definition found for "${cleanWord}".`);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setDefinition(`Vocabulary term: "${cleanWord}". Tap + to add to your revision deck.`);
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [word]);

  const handleSaveToDeck = () => {
    localDb.saveFlashcard({
      word: word.trim(),
      phonetic: phonetic || undefined,
      partOfSpeech: partOfSpeech || undefined,
      definition: definition || 'Saved from reading text',
      exampleSentence: `Extracted from Cambridge IELTS passage.`,
    });
    setSaved(true);
    if (onAddedFlashcard) onAddedFlashcard();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      style={{
        top: Math.min(window.innerHeight - 250, position.y + 10),
        left: Math.min(window.innerWidth - 320, Math.max(10, position.x - 140)),
      }}
      className="fixed z-50 w-72 rounded-2xl bg-white border border-indigo-200 shadow-xl p-4 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
        <div>
          <div className="font-bold text-sm text-indigo-700 capitalize">{word}</div>
          <div className="text-[11px] text-slate-500 font-mono">
            {phonetic} {partOfSpeech && `• ${partOfSpeech}`}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
        >
          ✕
        </button>
      </div>

      <div className="min-h-[50px] mb-3 text-slate-600 leading-relaxed">
        {loading ? (
          <div className="flex items-center gap-2 text-indigo-600 py-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin" /> Looking up definition...
          </div>
        ) : (
          <p>{definition}</p>
        )}
      </div>

      <button
        onClick={handleSaveToDeck}
        disabled={loading || saved}
        className={`w-full py-2 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all ${
          saved
            ? 'bg-emerald-600 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
        }`}
      >
        {saved ? (
          <>
            <Check className="w-3.5 h-3.5" /> Added to Flashcards
          </>
        ) : (
          <>
            <Plus className="w-3.5 h-3.5" /> Save to Flashcard Deck
          </>
        )}
      </button>
    </div>
  );
};
