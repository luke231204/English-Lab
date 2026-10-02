import type { Flashcard, TestAttempt } from '../types';

const ATTEMPTS_KEY = 'ielts_prep_attempts_v1';
const FLASHCARDS_KEY = 'ielts_prep_flashcards_v1';

// Seed default flashcards if empty
const DEFAULT_CARDS: Flashcard[] = [
  {
    id: 'fc-1',
    word: 'Aril',
    phonetic: '/ˈær.ɪl/',
    partOfSpeech: 'noun',
    definition: 'An extra seed covering, typically colored and hairy or fleshy, e.g. the mace surrounding nutmeg.',
    exampleSentence: 'The covering known as the aril is used to produce mace.',
    boxLevel: 2,
    nextReviewAt: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fc-2',
    word: 'Monopoly',
    phonetic: '/məˈnɒp.əl.i/',
    partOfSpeech: 'noun',
    definition: 'The exclusive possession or control of the supply of or trade in a commodity or service.',
    exampleSentence: 'The Dutch held a strict monopoly over the nutmeg trade in the 17th century.',
    boxLevel: 1,
    nextReviewAt: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fc-3',
    word: 'Lucrative',
    phonetic: '/ˈluː.krə.tɪv/',
    partOfSpeech: 'adjective',
    definition: 'Producing a great deal of profit.',
    exampleSentence: 'Nutmeg was once one of the most lucrative agricultural products in the world.',
    boxLevel: 0,
    nextReviewAt: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fc-4',
    word: 'Disseminate',
    phonetic: '/dɪˈsem.ɪ.neɪt/',
    partOfSpeech: 'verb',
    definition: 'Spread (something, especially information) widely.',
    exampleSentence: 'The recruitment agency will disseminate your CV to potential employers.',
    boxLevel: 1,
    nextReviewAt: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  }
];

export const localDb = {
  getAttempts(): TestAttempt[] {
    try {
      const data = localStorage.getItem(ATTEMPTS_KEY);
      if (!data) {
        // Return a realistic initial mock history so graphs look great out of the box
        const mock: TestAttempt[] = [
          {
            id: 'mock-1',
            book: 14,
            testNumber: 1,
            moduleType: 'full',
            isStrict: true,
            rawScoreListening: 31,
            bandScoreListening: 7.0,
            rawScoreReading: 32,
            bandScoreReading: 7.0,
            overallBand: 7.0,
            timeSpentSec: 3500,
            completedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            answers: {},
          },
          {
            id: 'mock-2',
            book: 14,
            testNumber: 2,
            moduleType: 'listening',
            isStrict: true,
            rawScoreListening: 34,
            bandScoreListening: 7.5,
            overallBand: 7.5,
            timeSpentSec: 1800,
            completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            answers: {},
          },
          {
            id: 'mock-3',
            book: 14,
            testNumber: 3,
            moduleType: 'reading',
            isStrict: true,
            rawScoreReading: 35,
            bandScoreReading: 8.0,
            overallBand: 8.0,
            timeSpentSec: 2200,
            completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
            answers: {},
          }
        ];
        localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(mock));
        return mock;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveAttempt(attempt: TestAttempt): void {
    const attempts = this.getAttempts();
    attempts.unshift(attempt);
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  },

  getFlashcards(): Flashcard[] {
    try {
      const data = localStorage.getItem(FLASHCARDS_KEY);
      if (!data) {
        localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(DEFAULT_CARDS));
        return DEFAULT_CARDS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_CARDS;
    }
  },

  saveFlashcard(card: Omit<Flashcard, 'id' | 'createdAt' | 'boxLevel' | 'nextReviewAt'>): Flashcard {
    const cards = this.getFlashcards();
    const newCard: Flashcard = {
      ...card,
      id: 'fc-' + Date.now(),
      boxLevel: 0,
      nextReviewAt: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    cards.unshift(newCard);
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
    return newCard;
  },

  updateFlashcard(id: string, updates: Partial<Flashcard>): void {
    const cards = this.getFlashcards();
    const idx = cards.findIndex(c => c.id === id);
    if (idx !== -1) {
      cards[idx] = { ...cards[idx], ...updates };
      localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
    }
  },

  deleteFlashcard(id: string): void {
    const cards = this.getFlashcards().filter(c => c.id !== id);
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
  }
};
