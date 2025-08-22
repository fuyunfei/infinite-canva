/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { generateRelatedQuestions } from '../services/openRouterService';

interface HoverPopupProps {
  word: string;
  position: { x: number; y: number };
  isVisible: boolean;
  onQuestionClick: (question: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  preGeneratedQuestions?: string[];
}

interface RelatedQuestion {
  id: string;
  question: string;
}

const HoverPopup: React.FC<HoverPopupProps> = ({ 
  word, 
  position, 
  isVisible, 
  onQuestionClick,
  onMouseEnter,
  onMouseLeave,
  preGeneratedQuestions = []
}) => {
  const [questions, setQuestions] = useState<RelatedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasGenerated, setHasGenerated] = useState<string>('');
  const popupRef = useRef<HTMLDivElement>(null);

  // Use pre-generated questions if available, otherwise generate on demand
  useEffect(() => {
    if (isVisible && word) {
      if (preGeneratedQuestions.length > 0) {
        // Use pre-generated questions
        const relatedQuestions: RelatedQuestion[] = preGeneratedQuestions.map((q, index) => ({
          id: `${index}`,
          question: q
        }));
        setQuestions(relatedQuestions);
        setIsLoading(false);
        setHasGenerated(word);
      } else if (word !== hasGenerated) {
        // Fallback to real-time generation
        generateQuestionsForWord(word);
      }
    }
  }, [isVisible, word, preGeneratedQuestions, hasGenerated]);

  const generateQuestionsForWord = async (targetWord: string) => {
    if (isLoading || !targetWord.trim()) return;
    
    setIsLoading(true);
    setHasGenerated(targetWord);
    
    try {
      const questionTexts = await generateRelatedQuestions(targetWord);
      const relatedQuestions: RelatedQuestion[] = questionTexts.map((q, index) => ({
        id: `${index}`,
        question: q
      }));
      
      setQuestions(relatedQuestions);
    } catch (error) {
      console.error('Failed to generate related questions:', error);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={popupRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y - 10, // Slightly above the word
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '0.75rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '200px',
        maxWidth: '300px',
        transform: 'translateY(-100%)', // Position above the word
        fontSize: '0.85em',
        lineHeight: '1.4'
      }}
    >
      <div style={{
        fontWeight: '600',
        marginBottom: '0.5rem',
        color: '#333',
        fontSize: '0.9em'
      }}>
        Related to "{word}"
      </div>
      
      {isLoading ? (
        <div style={{ 
          color: '#666',
          fontStyle: 'italic',
          padding: '0.5rem 0'
        }}>
          Generating questions...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => onQuestionClick(q.question)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem',
                font: 'inherit',
                color: '#0000ff',
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                fontSize: '0.85em'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {q.question}
            </button>
          ))}
        </div>
      )}
      
      {/* Small arrow pointing to the word */}
      <div style={{
        position: 'absolute',
        bottom: '-6px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid rgba(255, 255, 255, 0.95)'
      }} />
    </div>
  );
};

export default HoverPopup;
