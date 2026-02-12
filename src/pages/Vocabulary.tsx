import { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, Languages, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VocabularyCard } from '@/components/vocabulary/VocabularyCard';
import { Layout } from '@/components/layout/Layout';
import { useApp } from '@/contexts/AppContext';
import { Link } from 'react-router-dom';

type SortOption = 'recent' | 'alphabetical' | 'book';
type FilterOption = 'all' | 'known' | 'unknown';

export default function Vocabulary() {
  const { vocabulary, books } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedBook, setSelectedBook] = useState<string>('all');

  const filteredVocabulary = useMemo(() => {
    let result = [...vocabulary];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.word.toLowerCase().includes(query) ||
          item.translation.toLowerCase().includes(query) ||
          item.sentence.toLowerCase().includes(query)
      );
    }

    // Known/Unknown filter
    if (filterBy === 'known') {
      result = result.filter((item) => item.isKnown);
    } else if (filterBy === 'unknown') {
      result = result.filter((item) => !item.isKnown);
    }

    // Book filter
    if (selectedBook !== 'all') {
      result = result.filter((item) => item.bookId === selectedBook);
    }

    // Sort
    switch (sortBy) {
      case 'alphabetical':
        result.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case 'book':
        result.sort((a, b) => a.bookTitle.localeCompare(b.bookTitle));
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [vocabulary, searchQuery, sortBy, filterBy, selectedBook]);

  const stats = {
    total: vocabulary.length,
    known: vocabulary.filter((v) => v.isKnown).length,
    unknown: vocabulary.filter((v) => !v.isKnown).length,
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Vocabularul tău</h1>
          <p className="text-muted-foreground">
            Toate cuvintele salvate din lecturile tale
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Badge
            variant={filterBy === 'all' ? 'default' : 'secondary'}
            className="cursor-pointer px-4 py-2 text-sm"
            onClick={() => setFilterBy('all')}
          >
            Toate ({stats.total})
          </Badge>
          <Badge
            variant={filterBy === 'unknown' ? 'default' : 'secondary'}
            className="cursor-pointer px-4 py-2 text-sm"
            onClick={() => setFilterBy('unknown')}
          >
            De învățat ({stats.unknown})
          </Badge>
          <Badge
            variant={filterBy === 'known' ? 'default' : 'secondary'}
            className="cursor-pointer px-4 py-2 text-sm"
            onClick={() => setFilterBy('known')}
          >
            Cunoscute ({stats.known})
          </Badge>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Caută cuvinte sau traduceri..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger className="w-[180px]">
                <BookOpen className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Toate cărțile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate cărțile</SelectItem>
                {books.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px]">
                <SortAsc className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recente</SelectItem>
                <SelectItem value="alphabetical">Alfabetic</SelectItem>
                <SelectItem value="book">După carte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vocabulary List */}
        {filteredVocabulary.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-muted/30 py-16">
            <Languages className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">
              {vocabulary.length === 0
                ? 'Niciun cuvânt salvat încă'
                : 'Niciun rezultat găsit'}
            </h3>
            <p className="mb-4 text-center text-muted-foreground">
              {vocabulary.length === 0
                ? 'Începe să citești și atinge cuvintele necunoscute pentru a le salva.'
                : 'Încearcă să modifici filtrele sau termenul de căutare.'}
            </p>
            {vocabulary.length === 0 && (
              <Link to="/library">
                <Button>Mergi la bibliotecă</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredVocabulary.map((item) => (
              <VocabularyCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
