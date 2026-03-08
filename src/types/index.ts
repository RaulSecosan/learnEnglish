export interface Book {
  id: string;
  title: string;
  format?: "epub" | "pdf";
  author: string;
  coverUrl: string;
  language: string;
  progress: number;
  totalPages: number;
  currentPage: number;
  lastRead: Date;
  addedAt: Date;
  content?: string;
  contentUrl?: string;
  contentPath?: string;
  contentSha?: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  sentence: string;
  sentenceTranslation: string;
  bookId: string;
  bookTitle: string;
  chapter: string;
  position: number;
  createdAt: Date;
  lastReviewed: Date | null;
  reviewCount: number;
  isKnown: boolean;
  notes: string;
  tags: string[];
}

export interface ReadingSettings {
  fontSize: number;
  lineHeight: number;
  fontFamily: 'reading' | 'sans';
  theme: 'light' | 'dark' | 'sepia';
}

export interface TranslationPopup {
  word: string;
  translation: string;
  sentence: string;
  sentenceTranslation: string;
  position: { x: number; y: number };
}

export type ReviewStatus = 'new' | 'learning' | 'known';
