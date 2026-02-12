import { useState } from 'react';
import { Volume2, RotateCcw } from 'lucide-react';
import { VocabularyItem } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FlashCardProps {
  item: VocabularyItem;
  onResult: (known: boolean) => void;
}

export function FlashCard({ item, onResult }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleSpeak = (text: string, lang: string = 'fr-FR') => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleResult = (known: boolean) => {
    setIsFlipped(false);
    setTimeout(() => onResult(known), 300);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div 
        className={cn('flashcard cursor-pointer', isFlipped && 'flipped')}
        onClick={handleFlip}
      >
        <div className="flashcard-inner relative h-72">
          {/* Front */}
          <Card className="flashcard-front absolute inset-0 flex flex-col items-center justify-center p-8">
            <Button
              variant="ghost"
              size="icon"
              className="mb-4"
              onClick={(e) => {
                e.stopPropagation();
                handleSpeak(item.word);
              }}
            >
              <Volume2 className="h-6 w-6" />
            </Button>
            <h2 className="mb-4 text-center text-3xl font-bold">{item.word}</h2>
            <p className="text-center text-sm italic text-muted-foreground">{item.sentence}</p>
            <p className="mt-6 text-sm text-muted-foreground">Apasă pentru a vedea traducerea</p>
          </Card>

          {/* Back */}
          <Card className="flashcard-back absolute inset-0 flex flex-col items-center justify-center bg-primary/5 p-8">
            <h2 className="mb-2 text-center text-3xl font-bold text-primary">{item.translation}</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">{item.sentenceTranslation}</p>
            
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResult(false);
                }}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Repetă
              </Button>
              <Button
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResult(true);
                }}
                className="gap-2 bg-success hover:bg-success/90"
              >
                Știu!
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Din: {item.bookTitle} • {item.chapter}
      </p>
    </div>
  );
}
