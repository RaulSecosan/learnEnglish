import { useState, useMemo } from 'react';
import { GraduationCap, RotateCcw, Trophy, ArrowRight, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FlashCard } from '@/components/review/FlashCard';
import { Layout } from '@/components/layout/Layout';
import { useApp } from '@/contexts/AppContext';
import { Link } from 'react-router-dom';

export default function Review() {
  const { vocabulary, updateVocabularyItem } = useApp();
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<{ known: number; unknown: number }>({
    known: 0,
    unknown: 0,
  });

  const wordsToReview = useMemo(() => {
    return vocabulary.filter((item) => !item.isKnown);
  }, [vocabulary]);

  const currentWord = wordsToReview[currentIndex];
  const isSessionComplete = sessionStarted && currentIndex >= wordsToReview.length;
  const progress = sessionStarted ? ((currentIndex) / wordsToReview.length) * 100 : 0;

  const startSession = () => {
    setSessionStarted(true);
    setCurrentIndex(0);
    setSessionResults({ known: 0, unknown: 0 });
  };

  const handleResult = (known: boolean) => {
    if (known) {
      updateVocabularyItem(currentWord.id, { 
        isKnown: true,
        lastReviewed: new Date(),
        reviewCount: currentWord.reviewCount + 1,
      });
      setSessionResults((prev) => ({ ...prev, known: prev.known + 1 }));
    } else {
      updateVocabularyItem(currentWord.id, { 
        lastReviewed: new Date(),
        reviewCount: currentWord.reviewCount + 1,
      });
      setSessionResults((prev) => ({ ...prev, unknown: prev.unknown + 1 }));
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const resetSession = () => {
    setSessionStarted(false);
    setCurrentIndex(0);
    setSessionResults({ known: 0, unknown: 0 });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Recapitulare</h1>
          <p className="text-muted-foreground">
            Exersează cuvintele salvate cu flashcard-uri interactive
          </p>
        </div>

        {/* No words to review */}
        {wordsToReview.length === 0 && !sessionStarted && (
          <Card className="mx-auto max-w-md p-8 text-center">
            <Trophy className="mx-auto mb-4 h-16 w-16 text-success" />
            <h2 className="mb-2 text-xl font-semibold">Felicitări!</h2>
            <p className="mb-6 text-muted-foreground">
              Ai învățat toate cuvintele din vocabularul tău. Continuă să citești pentru a descoperi 
              cuvinte noi!
            </p>
            <Link to="/library">
              <Button className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Mergi la bibliotecă
              </Button>
            </Link>
          </Card>
        )}

        {/* Start Session */}
        {wordsToReview.length > 0 && !sessionStarted && (
          <Card className="mx-auto max-w-md p-8 text-center">
            <div className="mb-6 inline-flex rounded-full bg-primary/10 p-4">
              <Languages className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">Gata de recapitulare?</h2>
            <p className="mb-2 text-muted-foreground">
              Ai <span className="font-medium text-foreground">{wordsToReview.length}</span> cuvinte 
              de recapitulat.
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              Vei vedea fiecare cuvânt și vei încerca să-ți amintești traducerea.
            </p>
            <Button size="lg" onClick={startSession} className="gap-2">
              Începe sesiunea
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        )}

        {/* Active Session */}
        {sessionStarted && !isSessionComplete && currentWord && (
          <div className="mx-auto max-w-md">
            {/* Progress */}
            <div className="mb-8">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {currentIndex + 1} din {wordsToReview.length}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Flashcard */}
            <FlashCard item={currentWord} onResult={handleResult} />
          </div>
        )}

        {/* Session Complete */}
        {isSessionComplete && (
          <Card className="mx-auto max-w-md p-8 text-center">
            <Trophy className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h2 className="mb-2 text-2xl font-bold">Sesiune completă!</h2>
            
            <div className="my-6 flex justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-success">{sessionResults.known}</p>
                <p className="text-sm text-muted-foreground">Cunoscute</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{sessionResults.unknown}</p>
                <p className="text-sm text-muted-foreground">De repetat</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {sessionResults.unknown > 0 && (
                <Button onClick={resetSession} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Recapitulează din nou
                </Button>
              )}
              <Link to="/vocabulary">
                <Button variant="outline" className="w-full gap-2">
                  <Languages className="h-4 w-4" />
                  Vezi vocabularul
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
