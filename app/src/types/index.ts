export type QuestionType = 
  | 'fill_blank' 
  | 'mcq' 
  | 'tfng' 
  | 'matching' 
  | 'sentence_completion' 
  | 'summary' 
  | 'diagram' 
  | 'short_answer';

export interface Question {
  id: number;
  type: QuestionType | string;
  prompt: string;
  options?: string[];
  answers: string[];
  notes?: string;
  instructions?: string;
}

export interface ListeningSection {
  part: number;
  title: string;
  pdf_page?: number;
  start_sec: number;
  end_sec: number;
  audio_path?: string;
  context_text?: string;
  questions: Question[];
}

export interface ReadingPassage {
  passage_num: number;
  title: string | null;
  pdf_page_start?: number;
  pdf_page_end?: number;
  passage_text?: string | null;
  questions: Question[];
}

export interface TestData {
  book: number;
  test: number;
  title?: string;
  listening: {
    audio_path: string;
    sections: ListeningSection[];
  };
  reading: {
    passages: ReadingPassage[];
  };
}

export interface TestAttempt {
  id: string;
  book: number;
  testNumber: number;
  moduleType: 'listening' | 'reading' | 'full';
  isStrict: boolean;
  rawScoreListening?: number;
  bandScoreListening?: number;
  rawScoreReading?: number;
  bandScoreReading?: number;
  overallBand: number;
  timeSpentSec: number;
  completedAt: string; // ISO-8601 string
  answers: Record<string, string>; // question key e.g. "listening_1" -> userAnswer
}

export interface Flashcard {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition: string;
  exampleSentence?: string;
  boxLevel: number; // 0 to 5
  nextReviewAt: string; // YYYY-MM-DD
  createdAt: string;
}
