import { Volume2, BookOpen, MoreVertical, Check, Trash2 } from 'lucide-react';
import { VocabularyItem } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { getSpeechCode } from '@/data/languages';

interface VocabularyCardProps {
  item: VocabularyItem;
}

export function VocabularyCard({ item }: VocabularyCardProps) {
  const { updateVocabularyItem, removeVocabularyItem, sourceLanguage, targetLanguage } = useApp();
  const navigate = useNavigate();

  const handleSpeak = (text: string, isTranslation: boolean = false) => {
    const langCode = isTranslation ? targetLanguage : sourceLanguage;
    const speechCode = getSpeechCode(langCode);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechCode;
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const handleToggleKnown = () => {
    updateVocabularyItem(item.id, { isKnown: !item.isKnown });
  };

  const handleGoToContext = () => {
    navigate(`/reader/${item.bookId}`);
  };

  return (
    <Card className={cn(
      'group overflow-hidden border transition-all duration-200 hover:shadow-lg',
      item.isKnown && 'border-success/30 bg-success/5'
    )}>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => handleSpeak(item.word)}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            <div>
              <h3 className="text-lg font-semibold">{item.word}</h3>
              <p className="text-primary">{item.translation}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleKnown}>
                <Check className="mr-2 h-4 w-4" />
                {item.isKnown ? 'Marchează necunoscut' : 'Marchează cunoscut'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleGoToContext}>
                <BookOpen className="mr-2 h-4 w-4" />
                Vezi în context
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => removeVocabularyItem(item.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Șterge
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Original sentence from the book */}
        <div className="mb-3 space-y-3 rounded-lg bg-muted/50 p-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Propoziție originală:</p>
            <div className="flex items-start gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="mt-0.5 h-6 w-6 shrink-0"
                onClick={() => handleSpeak(item.sentence)}
              >
                <Volume2 className="h-3 w-3" />
              </Button>
              <p className="text-sm italic">{item.sentence}</p>
            </div>
          </div>
          
          <div className="border-t border-border pt-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Traducere:</p>
            <div className="flex items-start gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="mt-0.5 h-6 w-6 shrink-0"
                onClick={() => handleSpeak(item.sentenceTranslation, true)}
              >
                <Volume2 className="h-3 w-3" />
              </Button>
              <p className="text-sm text-muted-foreground">{item.sentenceTranslation}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            <span>{item.bookTitle}</span>
            <span>•</span>
            <span>{item.chapter}</span>
          </div>
          
          <div className="flex gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.isKnown && (
              <Badge className="bg-success text-success-foreground text-xs">
                Cunoscut
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
