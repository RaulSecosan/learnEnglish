import { Book } from '@/types';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const fallbackCover = useMemo(
    () =>
      'data:image/svg+xml;base64,' +
      btoa(
        `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
          <rect width="400" height="600" fill="#f4efe9"/>
          <rect x="36" y="36" width="328" height="528" rx="18" fill="#f0e6db"/>
          <rect x="66" y="90" width="268" height="12" rx="6" fill="#e3d7ca"/>
          <rect x="66" y="120" width="220" height="10" rx="5" fill="#e3d7ca"/>
          <rect x="66" y="150" width="190" height="10" rx="5" fill="#e3d7ca"/>
          <rect x="66" y="190" width="240" height="10" rx="5" fill="#e3d7ca"/>
          <rect x="66" y="230" width="180" height="10" rx="5" fill="#e3d7ca"/>
        </svg>`
      ),
    []
  );

  return (
    <Link to={`/reader/${book.id}`} className="group">
      <Card className="cursor-pointer overflow-hidden border-none bg-card shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={book.coverUrl || fallbackCover}
          alt={book.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(event) => {
            event.currentTarget.src = fallbackCover;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <span className="text-sm font-medium text-white">Continuă lectura →</span>
        </div>
      </div>

      <div className="p-4">
        <Badge variant="secondary" className="mb-2 text-xs">
          {book.language}
        </Badge>
        <h3 className="mb-1 line-clamp-1 font-semibold text-foreground">{book.title}</h3>
        <p className="mb-3 text-sm text-muted-foreground">{book.author}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progres</span>
            <span>{book.progress}%</span>
          </div>
          <Progress value={book.progress} className="h-1.5" />
        </div>
      </div>
      </Card>
    </Link>
  );
}
