import { BookCard } from '@/components/library/BookCard';
import { ImportBookButton } from '@/components/library/ImportBookButton';
import { Layout } from '@/components/layout/Layout';
import { useApp } from '@/contexts/AppContext';
import { Book, Clock, TrendingUp } from 'lucide-react';

export default function Library() {
  const { books, vocabulary } = useApp();

  const recentBooks = [...books].sort(
    (a, b) => new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime()
  );

  const totalWordsLearned = vocabulary.filter((v) => v.isKnown).length;
  const totalWordsToReview = vocabulary.filter((v) => !v.isKnown).length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Biblioteca ta</h1>
            <p className="text-muted-foreground">Citește și învață din cărțile tale preferate</p>
          </div>
          <ImportBookButton />
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm">
            <div className="rounded-lg bg-primary/10 p-3">
              <Book className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{books.length}</p>
              <p className="text-sm text-muted-foreground">Cărți în bibliotecă</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm">
            <div className="rounded-lg bg-success/10 p-3">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalWordsLearned}</p>
              <p className="text-sm text-muted-foreground">Cuvinte învățate</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm">
            <div className="rounded-lg bg-accent/10 p-3">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalWordsToReview}</p>
              <p className="text-sm text-muted-foreground">De recapitulat</p>
            </div>
          </div>
        </div>

        {/* Continue Reading */}
        {recentBooks.length > 0 && recentBooks[0].progress > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Continuă lectura</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <BookCard book={recentBooks[0]} />
            </div>
          </section>
        )}

        {/* All Books */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">Toate cărțile</h2>
          {books.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-muted/30 py-16">
              <Book className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">Nicio carte încă</h3>
              <p className="mb-4 text-muted-foreground">Importă prima ta carte pentru a începe să înveți</p>
              <ImportBookButton />
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
