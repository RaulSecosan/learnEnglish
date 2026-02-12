import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ReaderSettings } from '@/components/reader/ReaderSettings';
import { InteractiveText } from '@/components/reader/InteractiveText';
import { useApp } from '@/contexts/AppContext';
import { Layout } from '@/components/layout/Layout';

export default function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { books } = useApp();

  const book = books.find((b) => b.id === bookId);
  const [remoteContent, setRemoteContent] = useState<string>('');
  const [contentError, setContentError] = useState(false);

  const content = book?.content?.trim() ?? remoteContent.trim();
  const hasContent = content.length > 0;

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      if (!book || book.content?.trim()) return;
      if (!book.contentUrl) return;

      try {
        const response = await fetch(book.contentUrl);
        if (!response.ok) {
          throw new Error('content-fetch-failed');
        }
        const text = await response.text();
        if (isMounted) {
          setRemoteContent(text);
          setContentError(false);
        }
      } catch (err) {
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
      {/* Reader Header */}
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
              <h1 className="text-sm font-medium line-clamp-1">{book.title}</h1>
              <p className="text-xs text-muted-foreground">{book.author}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-muted-foreground">
                {book.currentPage} / {book.totalPages}
              </span>
              <Progress value={book.progress} className="h-2 w-24" />
            </div>
            <ReaderSettings />
          </div>
        </div>
      </header>

      {/* Reading Content */}
      <div className="min-h-[calc(100vh-3.5rem)] pb-20 pt-8">
        {hasContent ? (
          <InteractiveText
            content={content}
            bookId={book.id}
            bookTitle={book.title}
          />
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

      {/* Mobile Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-3 sm:hidden">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">{book.progress}%</span>
          <Progress value={book.progress} className="h-2 flex-1" />
          <span className="text-sm text-muted-foreground">{book.currentPage}/{book.totalPages}</span>
        </div>
      </div>
    </div>
  );
}
