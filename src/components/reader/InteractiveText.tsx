import { useState, useCallback, useMemo } from 'react';
import { TranslationPopup } from './TranslationPopup';
import { TranslationPopup as TranslationPopupType } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface InteractiveTextProps {
  content: string;
  bookId: string;
  bookTitle: string;
}

// Helper function to extract the full sentence containing a word at a given position
const extractSentence = (text: string, wordPosition: number): string => {
  // Find sentence boundaries
  const sentenceEnders = /[.!?]/g;
  let sentenceStart = 0;
  let sentenceEnd = text.length;
  
  // Find the start of the sentence
  for (let i = wordPosition - 1; i >= 0; i--) {
    if (/[.!?]/.test(text[i])) {
      sentenceStart = i + 1;
      break;
    }
  }
  
  // Find the end of the sentence
  for (let i = wordPosition; i < text.length; i++) {
    if (/[.!?]/.test(text[i])) {
      sentenceEnd = i + 1;
      break;
    }
  }
  
  return text.slice(sentenceStart, sentenceEnd).trim();
};

export function InteractiveText({ content, bookId, bookTitle }: InteractiveTextProps) {
  const [popup, setPopup] = useState<TranslationPopupType | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<string>('');
  const { vocabulary, readingSettings } = useApp();

  const wordPositions = useMemo(() => {
    const positions: number[] = [];
    let offset = 0;
    const tokens = content.split(/(\s+)/);

    for (const token of tokens) {
      if (/^\s+$/.test(token)) {
        offset += token.length;
        continue;
      }
      positions.push(offset);
      offset += token.length;
    }

    return positions;
  }, [content]);

  const savedWords = vocabulary
    .filter((item) => item.bookId === bookId)
    .map((item) => item.word.toLowerCase());

  const handleWordClick = useCallback((e: React.MouseEvent, word: string, wordIndex: number) => {
    const cleanWord = word.replace(/[.,!?;:"']/g, '');
    if (!cleanWord) return;

    const wordPosition = wordPositions[wordIndex] ?? 0;
    
    // Extract the full sentence
    const fullSentence = extractSentence(content, wordPosition);
    setSelectedSentence(fullSentence);
    
    setPopup({
      word: cleanWord,
      translation: '', // Will be filled by TranslationPopup
      sentence: fullSentence,
      sentenceTranslation: '', // Will be filled by TranslationPopup
      position: { x: e.clientX, y: e.clientY },
    });
  }, [content, wordPositions]);

  const closePopup = useCallback(() => {
    setPopup(null);
    setSelectedSentence('');
  }, []);

  const paragraphs = content.split('\n\n').filter(Boolean);
  let globalWordIndex = 0;

  return (
    <>
      <div
        className={cn(
          'reader-content mx-auto max-w-2xl px-6 py-8',
          readingSettings.fontFamily === 'reading' ? 'font-reading' : 'font-sans'
        )}
        style={{
          fontSize: `${readingSettings.fontSize}px`,
          lineHeight: readingSettings.lineHeight,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closePopup();
          }
        }}
      >
        {paragraphs.map((paragraph, pIndex) => (
          <p key={pIndex} className="mb-6 text-reader-text">
            {paragraph.split(/(\s+)/).map((token, tIndex) => {
              const isWhitespace = /^\s+$/.test(token);
              if (isWhitespace) return token;

              const currentWordIndex = globalWordIndex++;
              const cleanWord = token.toLowerCase().replace(/[.,!?;:"']/g, '');
              const isSaved = savedWords.includes(cleanWord);

              return (
                <span
                  key={`${pIndex}-${tIndex}`}
                  onClick={(e) => handleWordClick(e, token, currentWordIndex)}
                  className={cn(
                    'word-interactive',
                    isSaved && 'word-saved'
                  )}
                >
                  {token}
                </span>
              );
            })}
          </p>
        ))}
      </div>

      {popup && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closePopup}
          />
          <TranslationPopup
            data={popup}
            originalSentence={selectedSentence}
            onClose={closePopup}
            bookId={bookId}
            bookTitle={bookTitle}
          />
        </>
      )}
    </>
  );
}
