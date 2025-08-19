/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface ContentDisplayProps {
  content: string;
  onWordClick: (word: string) => void;
}

/**
 * A recursive-like function that parses a string for markdown (bold/italic)
 * and splits the remaining plain text into clickable words.
 * @param text The string to parse.
 * @param onWordClick The callback for when a word is clicked.
 * @returns An array of JSX elements.
 */
const renderInteractiveText = (text: string, onWordClick: (word: string) => void): (JSX.Element | string)[] => {
  // This regex splits the string by markdown bold/italic markers, but keeps the markers.
  // It handles both * and _ for italics, and ** and __ for bold.
  const parts = text.split(/(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_)/g).filter(Boolean);

  return parts.flatMap((part, i) => {
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      const content = part.slice(2, -2);
      return <strong key={i}>{renderInteractiveText(content, onWordClick)}</strong>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      const content = part.slice(1, -1);
      return <em key={i}>{renderInteractiveText(content, onWordClick)}</em>;
    }

    // For plain text parts, split into words and make them clickable.
    const words = part.split(/(\s+)/).filter(Boolean);
    return words.map((word, j) => {
      if (/\S/.test(word)) { // Check if it's a non-whitespace word.
        const cleanWord = word.replace(/[.,!?;:()"']/g, '');
        if (cleanWord) {
          return (
            <button
              key={`${i}-${j}`}
              onClick={() => onWordClick(cleanWord)}
              className="interactive-word"
              aria-label={`Learn more about ${cleanWord}`}
            >
              {word}
            </button>
          );
        }
      }
      // Render whitespace as-is to maintain spacing.
      return <span key={`${i}-${j}`}>{word}</span>;
    });
  });
};


/**
 * Renders markdown content with interactive words.
 * Supports headers, lists, bold, and italic.
 */
const InteractiveContent: React.FC<{
  content: string;
  onWordClick: (word: string) => void;
}> = ({ content, onWordClick }) => {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let currentListItems: (JSX.Element | string)[][] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ paddingLeft: '1.5em', margin: '1em 0' }}>
          {currentListItems.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      currentListItems.push(renderInteractiveText(trimmedLine.substring(2), onWordClick));
    } else {
      flushList(); // End of a list block
      if (trimmedLine.startsWith('### ')) {
        elements.push(<h3 key={index} style={{ margin: '1.5rem 0 0.5rem 0', fontSize: '1.2em' }}>{renderInteractiveText(trimmedLine.substring(4), onWordClick)}</h3>);
      } else if (trimmedLine.startsWith('## ')) {
        elements.push(<h2 key={index} style={{ margin: '1.5rem 0 0.5rem 0', fontSize: '1.4em' }}>{renderInteractiveText(trimmedLine.substring(3), onWordClick)}</h2>);
      } else if (trimmedLine.length > 0) {
        // This is a paragraph.
        elements.push(
          <p key={index} style={{ margin: '1em 0' }}>
            {renderInteractiveText(line, onWordClick)}
          </p>
        );
      }
    }
  });

  flushList(); // Flush any list that might be at the end of the content.

  return <>{elements}</>;
};

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, onWordClick }) => {
  if (content) {
    return <InteractiveContent content={content} onWordClick={onWordClick} />;
  }
  return null;
};

export default ContentDisplay;