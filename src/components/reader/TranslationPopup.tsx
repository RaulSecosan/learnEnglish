import { useState, useEffect, useMemo, type CSSProperties } from 'react';
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
const CHATGPT_ENDPOINT =
  (import.meta.env.VITE_CHATGPT_ENDPOINT as string | undefined) ||
  'https://api.openai.com/v1/chat/completions';
const CHATGPT_MODEL =
  (import.meta.env.VITE_CHATGPT_MODEL as string | undefined) || 'gpt-5.2';
const CHATGPT_API_KEY = import.meta.env.VITE_CHATGPT_API_KEY as string | undefined;

const buildEndpoints = () => {
  const configured = import.meta.env.VITE_TRANSLATE_ENDPOINT as string | undefined;
  const apiKey = import.meta.env.VITE_TRANSLATE_API_KEY as string | undefined;

  const endpoints = [configured || DEFAULT_ENDPOINT];
  if (apiKey) {
    endpoints.push('https://libretranslate.com/translate');
  }

  return { endpoints, apiKey };
};

const translateTextClassic = async (
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

const translateTextChatGpt = async (
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> => {
  if (!text.trim()) return '';
  if (!CHATGPT_API_KEY) {
    throw new Error('chatgpt-missing-config');
  }

  const source = sourceLang?.trim() || 'auto';
  const response = await fetch(CHATGPT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHATGPT_API_KEY}`,
    },
    body: JSON.stringify({
      model: CHATGPT_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            'You are a translation engine. Return only the translated text with no explanations.',
        },
        {
          role: 'user',
          content: `Translate the following text from "${source}" to "${targetLang}":\n\n${text}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    let apiMessage = 'unknown-error';
    try {
      const errorData = (await response.json()) as {
        error?: { message?: string; type?: string; code?: string };
      };
      apiMessage =
        errorData.error?.message ||
        errorData.error?.type ||
        errorData.error?.code ||
        apiMessage;
    } catch {
      // ignore parse errors
    }
    throw new Error(`chatgpt-translation-failed:${response.status}:${apiMessage}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const translated = data.choices?.[0]?.message?.content?.trim();
  if (!translated) {
    throw new Error('chatgpt-translation-empty');
  }

  return translated;
};

const translateWordAndSentenceChatGpt = async (
  word: string,
  sentence: string,
  sourceLang: string,
  targetLang: string,
): Promise<{ wordTranslation: string; sentenceTranslation: string }> => {
  if (!CHATGPT_API_KEY) {
    throw new Error('chatgpt-missing-config');
  }

  const source = sourceLang?.trim() || 'auto';
  const response = await fetch(CHATGPT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHATGPT_API_KEY}`,
    },
    body: JSON.stringify({
      model: CHATGPT_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional translator. Return exactly two lines: WORD=<translation> and SENTENCE=<translation>. No extra text.',
        },
        {
          role: 'user',
          content:
            `Source language: ${source}\nTarget language: ${targetLang}\n` +
            `Word to translate in context: ${word}\n` +
            `Sentence context: ${sentence}\n\n` +
            'Requirements:\n' +
            '- WORD must be the most common Romanian dictionary form (no article, no inflection).\n' +
            '- If multiple options are valid, prefer the neutral/common one used in dictionaries.\n' +
            '- SENTENCE must be a fluent, natural translation in Romanian.\n' +
            '- Preserve the meaning exactly; do not add explanations.',
        },
      ],
    }),
  });

  if (!response.ok) {
    let apiMessage = 'unknown-error';
    try {
      const errorData = (await response.json()) as {
        error?: { message?: string; type?: string; code?: string };
      };
      apiMessage =
        errorData.error?.message ||
        errorData.error?.type ||
        errorData.error?.code ||
        apiMessage;
    } catch {
      // ignore parse errors
    }
    throw new Error(`chatgpt-translation-failed:${response.status}:${apiMessage}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('chatgpt-translation-empty');
  }

  const wordMatch = content.match(/WORD=(.*)/i);
  const sentenceMatch = content.match(/SENTENCE=(.*)/i);
  const wordTranslation = wordMatch?.[1]?.trim();
  const sentenceTranslation = sentenceMatch?.[1]?.trim();

  if (!wordTranslation || !sentenceTranslation) {
    throw new Error('chatgpt-translation-parse-failed');
  }

  return { wordTranslation, sentenceTranslation };
};

const getChatGptErrorMessage = (message: string) => {
  if (message === 'chatgpt-missing-config') {
    return 'Adaugă VITE_CHATGPT_API_KEY în .env.local.';
  }

  if (message.startsWith('chatgpt-translation-failed:')) {
    const [, status = 'unknown', apiMessage = 'unknown-error'] = message.split(':');
    if (status === '401') {
      return 'Cheia ChatGPT este invalidă sau expirată (401).';
    }
    if (status === '429') {
      return 'Limită depășită sau fără credit pe OpenAI (429).';
    }
    return `OpenAI a răspuns cu ${status}: ${apiMessage}`;
  }

  if (message === 'chatgpt-translation-empty') {
    return 'ChatGPT a returnat răspuns gol.';
  }
  if (message === 'chatgpt-translation-parse-failed') {
    return 'Răspuns ChatGPT într-un format neașteptat.';
  }

  return 'Eroare de rețea/CORS către OpenAI API.';
};

export function TranslationPopup({ data, originalSentence, onClose, bookId, bookTitle }: TranslationPopupProps) {
  const { addVocabularyItem, vocabulary, targetLanguage, setTargetLanguage, sourceLanguage } = useApp();
  const { toast } = useToast();
  
  const [wordTranslation, setWordTranslation] = useState<string>('');
  const [sentenceTranslation, setSentenceTranslation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTranslator, setActiveTranslator] = useState<'chatgpt' | 'classic'>('chatgpt');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const isAlreadySaved = vocabulary.some(
    (item) => item.word.toLowerCase() === data.word.toLowerCase() && item.bookId === bookId
  );

  const translateWithProvider = async (provider: 'chatgpt' | 'classic') => {
    setIsLoading(true);
    setActiveTranslator(provider);
    try {
      const translationSource = sourceLanguage === targetLanguage ? 'auto' : sourceLanguage;
      if (provider === 'chatgpt') {
        const result = await translateWordAndSentenceChatGpt(
          data.word,
          originalSentence,
          translationSource,
          targetLanguage,
        );
        setWordTranslation(result.wordTranslation);
        setSentenceTranslation(result.sentenceTranslation);
      } else {
        const [wordTrans, sentenceTrans] = await Promise.all([
          translateTextClassic(data.word, translationSource, targetLanguage),
          translateTextClassic(originalSentence, translationSource, targetLanguage),
        ]);
        setWordTranslation(wordTrans);
        setSentenceTranslation(sentenceTrans);
      }
    } catch (error) {
      console.error('Translation error:', error);
      if (provider === 'chatgpt') {
        const details = getChatGptErrorMessage(
          error instanceof Error ? error.message : '',
        );
        toast({
          title: 'ChatGPT indisponibil',
          description: details,
          variant: 'destructive',
        });
        setWordTranslation('Nu am putut traduce.');
        setSentenceTranslation('Nu am putut traduce.');
      } else {
        setWordTranslation('Nu am putut traduce.');
        setSentenceTranslation('Nu am putut traduce.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Default translator: ChatGPT
  useEffect(() => {
    void translateWithProvider('chatgpt');
  }, [data.word, originalSentence, sourceLanguage, targetLanguage]);

  const handleSpeak = (text: string, langCode: string) => {
    if (!text.trim()) return;

    const speechCode = getSpeechCode(langCode);
    const languagePrefix = speechCode.split('-')[0].toLowerCase();
    const lowerSpeechCode = speechCode.toLowerCase();
    const voiceCandidates = voices.filter((voice) =>
      voice.lang.toLowerCase().startsWith(languagePrefix),
    );
    const preferredVoice =
      voiceCandidates.find((voice) => voice.lang.toLowerCase() === lowerSpeechCode) ||
      (langCode === 'en'
        ? voiceCandidates.find((voice) => voice.lang.toLowerCase().startsWith('en-us')) ||
          voiceCandidates.find((voice) => voice.lang.toLowerCase().startsWith('en-gb'))
        : null) ||
      voiceCandidates[0] ||
      null;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = preferredVoice?.lang || speechCode;
    utterance.voice = preferredVoice;
    utterance.rate = langCode === 'en' ? 0.92 : 0.88;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
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
  const isMobile = window.innerWidth < 640;
  const popupLayout = useMemo(() => {
    if (isMobile) {
      return {
        className: 'bottom-2 left-2 right-2 top-auto w-auto',
        style: undefined as CSSProperties | undefined,
      };
    }

    const margin = 12;
    const popupWidth = 384;
    const popupHeightEstimate = 460;
    const maxLeft = window.innerWidth - popupWidth - margin;
    const maxTop = window.innerHeight - popupHeightEstimate - margin;
    const left = Math.max(margin, Math.min(data.position.x, maxLeft));
    const top = Math.max(margin, Math.min(data.position.y + 10, maxTop));

    return {
      className: 'w-96',
      style: { left, top } as CSSProperties,
    };
  }, [data.position.x, data.position.y, isMobile]);

  return (
    <Card
      className={`animate-scale-in glass fixed z-50 max-h-[82vh] overflow-y-auto border-none shadow-2xl ${popupLayout.className}`}
      style={popupLayout.style}
    >
      <div className="p-3 sm:p-4">
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
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-sm text-muted-foreground">Traducere în:</span>
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger className="h-8 w-full sm:w-[180px]">
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

        <div className="mb-4 flex gap-2">
          <Button
            type="button"
            variant={activeTranslator === 'chatgpt' ? 'default' : 'outline'}
            size="sm"
            onClick={() => void translateWithProvider('chatgpt')}
            disabled={isLoading}
          >
            Tradu cu ChatGPT
          </Button>
          <Button
            type="button"
            variant={activeTranslator === 'classic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => void translateWithProvider('classic')}
            disabled={isLoading}
          >
            Tradu cu varianta veche
          </Button>
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
        <div className="flex flex-col gap-2 sm:flex-row">
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
