export interface WordToken {
  original: string;
  clean: string;
  orpIndex: number;
  pauseMultiplier: number;
}

export interface ReadingSession {
  id?: number;
  documentTitle: string;
  sourceType: 'paste' | 'txt' | 'pdf' | 'epub' | 'sample';
  timestamp: number;
  durationSeconds: number;
  wordsRead: number;
  averageWpm: number;
  targetWpm: number;
  completionPercentage: number;
  completed: boolean;
}

export interface SavedDocument {
  id: string;
  title: string;
  sourceType: 'paste' | 'txt' | 'pdf' | 'epub' | 'sample';
  text: string;
  wordCount: number;
  lastPosition: number;
  updatedAt: number;
  totalTimeSpentSeconds: number;
}

export type ThemeMode = 'warm-dark' | 'sepia' | 'sage' | 'paper' | 'amber' | 'dark';
export type ReaderMode = 'rsvp' | 'fulltext';
export type FontFamily = 'sans' | 'serif' | 'mono';

export interface UserPreferences {
  wpm: number;
  wordsPerChunk: 1 | 2 | 3;
  theme: ThemeMode;
  fontFamily: FontFamily;
  fontSize: 'small' | 'medium' | 'large' | 'huge';
  pauseOnPunctuation: boolean;
  pauseOnLongWords: boolean;
  showOrpGuide: boolean;
  bionicMode: boolean;
}
