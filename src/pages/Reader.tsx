import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, getBlob, ref } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ReaderSettings } from '@/components/reader/ReaderSettings';
import { InteractiveText } from '@/components/reader/InteractiveText';
import { useApp } from '@/contexts/AppContext';
import { Layout } from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';

const PAGE_BREAK_MARKER = '<<<PAGE_BREAK>>>';
const READER_HORIZONTAL_PADDING = 96;
const READER_VERTICAL_RESERVED = 220;
const MIN_PAGE_CHARS = 850;
const MAX_PAGE_CHARS = 2600;

const splitLongUnit = (text: string, maxChars: number): string[] => {
  if (text.length <= maxChars) return [text];

  const sentenceParts = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentenceParts.length <= 1) {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const word of words) {
      const candidate = currentChunk ? `${currentChunk} ${word}` : word;
      if (candidate.length <= maxChars || currentChunk.length === 0) {
        currentChunk = candidate;
      } else {
        chunks.push(currentChunk.trim());
        currentChunk = word;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentenceParts) {
    if (sentence.length > maxChars) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      chunks.push(...splitLongUnit(sentence, maxChars));
      continue;
    }

    const candidate = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    if (candidate.length <= maxChars || currentChunk.length === 0) {
      currentChunk = candidate;
    } else {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

const paginateForViewport = (text: string, maxChars: number): string[] => {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return [];

  const units = paragraphs.flatMap((paragraph) => splitLongUnit(paragraph, maxChars));
  const pages: string[] = [];
  let currentPage = '';

  for (const unit of units) {
    const candidate = currentPage ? `${currentPage}\n\n${unit}` : unit;
    if (candidate.length <= maxChars || currentPage.length === 0) {
      currentPage = candidate;
    } else {
      pages.push(currentPage.trim());
      currentPage = unit;
    }
  }

  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }

  return pages;
};

export default function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { books, updateBook, readingSettings, userId } = useApp();
  const { toast } = useToast();

  const book = books.find((b) => b.id === bookId);
  const [remoteContent, setRemoteContent] = useState<string>('');
  const [contentError, setContentError] = useState(false);
  const [pageInput, setPageInput] = useState('1');
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const handleResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const content = book?.content?.trim() ?? remoteContent.trim();
  const sourcePages = useMemo(
    () =>
      content
        ? content
            .split(PAGE_BREAK_MARKER)
            .map((page) => page.trim())
            .filter(Boolean)
        : [],
    [content],
  );

  const shouldUseAdaptivePagination =
    book?.format === 'epub' ||
    (!book?.format &&
      (sourcePages.length <= 40 || sourcePages.some((page) => page.length > 2800)));

  const adaptivePageChars = useMemo(() => {
    const availableWidth = Math.max(
      320,
      Math.min(720, viewport.width - READER_HORIZONTAL_PADDING),
    );
    const availableHeight = Math.max(320, viewport.height - READER_VERTICAL_RESERVED);
    const charWidthMultiplier = readingSettings.fontFamily === 'reading' ? 0.52 : 0.56;

    const charsPerLine = Math.max(
      28,
      Math.floor(availableWidth / (readingSettings.fontSize * charWidthMultiplier)),
    );
    const linesPerPage = Math.max(
      12,
      Math.floor(availableHeight / (readingSettings.fontSize * readingSettings.lineHeight)),
    );

    return Math.max(
      MIN_PAGE_CHARS,
      Math.min(MAX_PAGE_CHARS, charsPerLine * linesPerPage),
    );
  }, [
    readingSettings.fontFamily,
    readingSettings.fontSize,
    readingSettings.lineHeight,
    viewport.height,
    viewport.width,
  ]);

  const pages = useMemo(() => {
    if (!content) return [];

    if (!shouldUseAdaptivePagination) {
      return sourcePages.length > 0 ? sourcePages : [content];
    }

    const units = sourcePages.length > 0 ? sourcePages : [content];
    const adaptivePages = units.flatMap((unit) =>
      paginateForViewport(unit, adaptivePageChars),
    );

    return adaptivePages.length > 0 ? adaptivePages : units;
  }, [adaptivePageChars, content, shouldUseAdaptivePagination, sourcePages]);

  const effectiveTotalPages = pages.length || Math.max(book?.totalPages ?? 1, 1);
  const initialPage = Math.min(Math.max(book?.currentPage ?? 1, 1), effectiveTotalPages);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const pageContent = pages.length > 0 ? pages[currentPage - 1] || '' : content;
  const progress = Math.round((currentPage / effectiveTotalPages) * 100);
  const hasContent = content.length > 0;

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [book?.id, initialPage]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(Math.max(prev, 1), effectiveTotalPages));
  }, [effectiveTotalPages]);

  useEffect(() => {
    if (!book) return;

    const nextProgress = Math.round((currentPage / effectiveTotalPages) * 100);
    if (
      book.currentPage !== currentPage ||
      book.totalPages !== effectiveTotalPages ||
      book.progress !== nextProgress
    ) {
      updateBook(book.id, {
        currentPage,
        totalPages: effectiveTotalPages,
        progress: nextProgress,
        lastRead: new Date(),
      });
    }
  }, [book, currentPage, effectiveTotalPages, updateBook]);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      if (!book || book.content?.trim()) return;
      if (!book.contentUrl && !book.contentPath) return;

      try {
        let text = '';

        if (book.contentPath) {
          const contentRef = ref(storage, book.contentPath);
          const blob = await getBlob(contentRef);
          text = await blob.text();
        } else if (book.contentUrl) {
          const contentRef = ref(storage, book.contentUrl);
          const blob = await getBlob(contentRef);
          text = await blob.text();
        }

        if (isMounted) {
          setRemoteContent(text);
          setContentError(false);
        }
      } catch {
        if (isMounted) {
          setContentError(true);
        }
      }
    };

    void loadContent();

    return () => {
      isMounted = false;
    };
  }, [book]);

  const handleDeleteBook = async () => {
    if (!book || !userId) return;

    const confirmed = window.confirm(
      `Sigur vrei să ștergi cartea "${book.title}" din bibliotecă?`,
    );
    if (!confirmed) return;

    try {
      try {
        if (book.contentPath) {
          await deleteObject(ref(storage, book.contentPath));
        } else if (book.contentUrl) {
          await deleteObject(ref(storage, book.contentUrl));
        }
      } catch {
        // Continue even if storage file is missing.
      }

      await deleteDoc(doc(db, 'users', userId, 'books', book.id));
      toast({
        title: 'Carte ștearsă',
        description: `"${book.title}" a fost eliminată din bibliotecă.`,
      });
      navigate('/library');
    } catch {
      toast({
        title: 'Nu am putut șterge cartea',
        description: 'Reîncearcă în câteva secunde.',
        variant: 'destructive',
      });
    }
  };

  const handleJumpToPage = () => {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(currentPage));
      return;
    }
    const clamped = Math.min(Math.max(Math.floor(parsed), 1), effectiveTotalPages);
    setCurrentPage(clamped);
    setPageInput(String(clamped));
  };

  if (!book) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-medium">Cartea nu a fost găsită</h2>
          <Button onClick={() => navigate('/library')}>Înapoi la bibliotecă</Button>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-reader-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/library')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="hidden sm:block">
              <h1 className="line-clamp-1 text-sm font-medium">{book.title}</h1>
              <p className="text-xs text-muted-foreground">{book.author}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="hidden gap-2 text-destructive hover:text-destructive sm:inline-flex"
              onClick={handleDeleteBook}
            >
              <Trash2 className="h-4 w-4" />
              Șterge
            </Button>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-muted-foreground">
                {currentPage} / {effectiveTotalPages}
              </span>
              <Progress value={progress} className="h-2 w-24" />
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Input
                type="number"
                min={1}
                max={effectiveTotalPages}
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleJumpToPage();
                  }
                }}
                className="h-8 w-20"
              />
              <Button variant="outline" size="sm" onClick={handleJumpToPage}>
                Mergi
              </Button>
            </div>
            <ReaderSettings />
          </div>
        </div>
      </header>

      <div className="min-h-[calc(100vh-3.5rem)] pb-20 pt-8">
        {hasContent ? (
          <>
            <div className="container mx-auto mb-4 flex items-center justify-between px-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Pagina anterioară
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {currentPage} din {effectiveTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, effectiveTotalPages))
                }
                disabled={currentPage >= effectiveTotalPages}
              >
                Pagina următoare
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <InteractiveText
              content={pageContent}
              bookId={book.id}
              bookTitle={book.title}
            />
          </>
        ) : (
          <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-medium">
              {contentError ? 'Conținut indisponibil' : 'Se încarcă...'}
            </h2>
            <p className="mb-6 max-w-lg text-sm text-muted-foreground">
              {contentError
                ? 'Nu am putut încărca textul. Te rugăm să încerci din nou.'
                : 'Încărcăm conținutul cărții tale.'}
            </p>
            <Button onClick={() => navigate('/library')}>Înapoi la bibliotecă</Button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-3 sm:hidden">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{progress}%</span>
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-sm text-muted-foreground">
            {currentPage}/{effectiveTotalPages}
          </span>
          <Input
            type="number"
            min={1}
            max={effectiveTotalPages}
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleJumpToPage();
              }
            }}
            className="h-8 w-16"
          />
          <Button variant="outline" size="sm" onClick={handleJumpToPage}>
            Go
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, effectiveTotalPages))
            }
            disabled={currentPage >= effectiveTotalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteBook}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
