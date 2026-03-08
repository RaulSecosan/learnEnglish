import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Book, VocabularyItem, ReadingSettings } from "@/types";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

interface AppContextType {
  books: Book[];
  vocabulary: VocabularyItem[];
  readingSettings: ReadingSettings;
  isDarkMode: boolean;
  currentBook: Book | null;
  userId: string | null;
  targetLanguage: string;
  sourceLanguage: string;
  addBook: (book: Book) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  addVocabularyItem: (item: VocabularyItem) => void;
  updateVocabularyItem: (id: string, updates: Partial<VocabularyItem>) => void;
  removeVocabularyItem: (id: string) => void;
  setReadingSettings: (settings: ReadingSettings) => void;
  setIsDarkMode: (isDark: boolean) => void;
  setCurrentBook: (book: Book | null) => void;
  setTargetLanguage: (lang: string) => void;
  setSourceLanguage: (lang: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultReadingSettings: ReadingSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: "reading",
  theme: "light",
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [readingSettings, setReadingSettingsState] = useState<ReadingSettings>(
    defaultReadingSettings,
  );
  const [isDarkMode, setIsDarkModeState] = useState(false);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("ro"); // Default: Romanian
  const [sourceLanguage, setSourceLanguage] = useState("en"); // Default: English

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    setUserId("public");
  }, []);

  useEffect(() => {
    if (!userId) {
      setBooks([]);
      setVocabulary([]);
      return;
    }

    const booksRef = collection(db, "users", userId, "books");
    const vocabRef = collection(db, "users", userId, "vocabulary");

    const booksQuery = query(booksRef, orderBy("addedAt", "desc"));
    const unsubscribeBooks = onSnapshot(booksQuery, (snapshot) => {
      const nextBooks = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Omit<Book, "id">;
        const lastRead =
          (data.lastRead as any)?.toDate?.() ||
          (data.lastRead ? new Date(data.lastRead) : new Date());
        const addedAt =
          (data.addedAt as any)?.toDate?.() ||
          (data.addedAt ? new Date(data.addedAt) : new Date());

        return {
          ...data,
          id: docSnap.id,
          lastRead,
          addedAt,
        };
      });
      setBooks(nextBooks);
    });

    const unsubscribeVocab = onSnapshot(vocabRef, (snapshot) => {
      const nextVocab = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Omit<VocabularyItem, "id">;
        const createdAt =
          (data.createdAt as any)?.toDate?.() ||
          (data.createdAt ? new Date(data.createdAt) : new Date());
        const lastReviewed =
          (data.lastReviewed as any)?.toDate?.() ||
          (data.lastReviewed ? new Date(data.lastReviewed) : null);

        return {
          ...data,
          id: docSnap.id,
          createdAt,
          lastReviewed,
        };
      });
      setVocabulary(nextVocab);
    });

    return () => {
      unsubscribeBooks();
      unsubscribeVocab();
    };
  }, [userId]);

  const addBook = (book: Book) => {
    if (!userId) return;
    const bookRef = doc(db, "users", userId, "books", book.id);
    const { content, ...rest } = book;
    const payload = {
      ...rest,
      lastRead: book.lastRead ?? new Date(),
      addedAt: book.addedAt ?? new Date(),
    };
    void setDoc(bookRef, payload);
  };

  const updateBook = (id: string, updates: Partial<Book>) => {
    if (!userId) return;
    const bookRef = doc(db, "users", userId, "books", id);
    void updateDoc(bookRef, updates);
  };

  const addVocabularyItem = (item: VocabularyItem) => {
    if (!userId) return;
    const vocabRef = doc(db, "users", userId, "vocabulary", item.id);
    void setDoc(vocabRef, item);
  };

  const updateVocabularyItem = (
    id: string,
    updates: Partial<VocabularyItem>,
  ) => {
    if (!userId) return;
    const vocabRef = doc(db, "users", userId, "vocabulary", id);
    void updateDoc(vocabRef, updates);
  };

  const removeVocabularyItem = (id: string) => {
    if (!userId) return;
    const vocabRef = doc(db, "users", userId, "vocabulary", id);
    void deleteDoc(vocabRef);
  };

  const setReadingSettings = (settings: ReadingSettings) => {
    setReadingSettingsState(settings);
  };

  const setIsDarkMode = (isDark: boolean) => {
    setIsDarkModeState(isDark);
  };

  return (
    <AppContext.Provider
      value={{
        books,
        vocabulary,
        readingSettings,
        isDarkMode,
        currentBook,
        userId,
        targetLanguage,
        sourceLanguage,
        addBook,
        updateBook,
        addVocabularyItem,
        updateVocabularyItem,
        removeVocabularyItem,
        setReadingSettings,
        setIsDarkMode,
        setCurrentBook,
        setTargetLanguage,
        setSourceLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
