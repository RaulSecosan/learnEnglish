import { useState, useEffect } from 'react';
import { Volume2, BookmarkPlus, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TranslationPopup as TranslationPopupType } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { supportedLanguages, getLanguageByCode, getSpeechCode } from '@/data/languages';

interface TranslationPopupProps {
  data: TranslationPopupType;
  originalSentence: string;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
}

const DEFAULT_ENDPOINT = 'https://translate.cutie.dating/translate';

const buildEndpoints = () => {
  const configured = (import.meta as any)?.env?.VITE_TRANSLATE_ENDPOINT as
    | string
    | undefined;
  const apiKey = (import.meta as any)?.env?.VITE_TRANSLATE_API_KEY as
    | string
    | undefined;

  const endpoints = [configured || DEFAULT_ENDPOINT];
  if (apiKey) {
    endpoints.push('https://libretranslate.com/translate');
  }

  return { endpoints, apiKey };
};

const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> => {
  if (!text.trim()) return '';

  const { endpoints, apiKey } = buildEndpoints();
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang || 'auto',
          target: targetLang,
          format: 'text',
          ...(apiKey ? { api_key: apiKey } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`translation-failed:${response.status}`);
      }

      const data = (await response.json()) as { translatedText?: string };
      if (data.translatedText) {
        return data.translatedText;
      }
    } catch (error) {
      lastError = error;
      // Try next endpoint if available
    }
  }

  throw lastError ?? new Error('translation-failed');
};

export function TranslationPopup({ data, originalSentence, onClose, bookId, bookTitle }: TranslationPopupProps) {
  const { addVocabularyItem, vocabulary, targetLanguage, setTargetLanguage, sourceLanguage } = useApp();
  const { toast } = useToast();
  
  const [wordTranslation, setWordTranslation] = useState<string>('');
  const [sentenceTranslation, setSentenceTranslation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const isAlreadySaved = vocabulary.some(
    (item) => item.word.toLowerCase() === data.word.toLowerCase() && item.bookId === bookId
  );

  // Load translations when popup opens or language changes
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        const translationSource =
          sourceLanguage === targetLanguage ? 'auto' : sourceLanguage;
        const [wordTrans, sentenceTrans] = await Promise.all([
          translateText(data.word, translationSource, targetLanguage),
          translateText(originalSentence, translationSource, targetLanguage),
        ]);
        setWordTranslation(wordTrans);
        setSentenceTranslation(sentenceTrans);
      } catch (error) {
        console.error('Translation error:', error);
        setWordTranslation('Nu am putut traduce.');
        setSentenceTranslation('Nu am putut traduce.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [data.word, originalSentence, targetLanguage]);

  const handleSpeak = (text: string, langCode: string) => {
    const speechCode = getSpeechCode(langCode);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechCode;
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    if (isAlreadySaved) return;

    addVocabularyItem({
      id: Date.now().toString(),
      word: data.word,
      translation: wordTranslation,
      sentence: originalSentence,
      sentenceTranslation: sentenceTranslation,
      bookId,
      bookTitle,
      chapter: 'Capitolul I',
      position: data.position.x,
      createdAt: new Date(),
      lastReviewed: null,
      reviewCount: 0,
      isKnown: false,
      notes: '',
      tags: [],
    });

    toast({
      title: 'Cuvânt salvat!',
      description: `"${data.word}" a fost adăugat în vocabular.`,
    });
  };

  const targetLang = getLanguageByCode(targetLanguage);

  return (
    <Card
      className="animate-scale-in glass fixed z-50 w-96 overflow-hidden border-none shadow-2xl"
      style={{
        left: Math.min(data.position.x, window.innerWidth - 420),
        top: Math.min(data.position.y + 10, window.innerHeight - 400),
      }}
    >
      <div className="p-4">
        {/* Header with language selector */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleSpeak(data.word, sourceLanguage)}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
              <h3 className="text-xl font-semibold text-foreground">{data.word}</h3>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 mt-1">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Se traduce...</span>
              </div>
            ) : (
              <p className="text-lg text-primary mt-1">{wordTranslation}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="-mr-2 -mt-2">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Language selector */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Traducere în:</span>
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger className="w-[160px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Original sentence and translation */}
        <div className="mb-4 space-y-3 rounded-lg bg-muted/50 p-3">
          {/* Original sentence */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Propoziție originală:</p>
            <div className="flex items-start gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="mt-0.5 h-6 w-6 shrink-0"
                onClick={() => handleSpeak(originalSentence, sourceLanguage)}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
              <p className="text-sm italic text-foreground">{originalSentence}</p>
            </div>
          </div>
          
          {/* Translated sentence */}
          <div className="border-t border-border pt-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Traducere ({targetLang.flag} {targetLang.name}):
            </p>
            {isLoading ? (
              <div className="flex items-center gap-2 pl-8">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Se traduce...</span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-0.5 h-6 w-6 shrink-0"
                  onClick={() => handleSpeak(sentenceTranslation, targetLanguage)}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                <p className="text-sm text-muted-foreground">{sentenceTranslation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => handleSpeak(data.word, sourceLanguage)}
          >
            <Volume2 className="h-4 w-4" />
            Pronunție
          </Button>
          <Button
            variant={isAlreadySaved ? 'secondary' : 'default'}
            size="sm"
            className="flex-1 gap-2"
            onClick={handleSave}
            disabled={isAlreadySaved || isLoading}
          >
            {isAlreadySaved ? (
              <>
                <Check className="h-4 w-4" />
                Salvat
              </>
            ) : (
              <>
                <BookmarkPlus className="h-4 w-4" />
                Salvează
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
