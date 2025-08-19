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
 * A comprehensive function that parses markdown-style text with support for:
 * - Bold (**text** or __text__)
 * - Italic (*text* or _text_)
 * - Inline code (`code`)
 * - Strikethrough (~~text~~)
 * - Links ([text](url))
 * - Highlight (==text==)
 * @param text The string to parse.
 * @param onWordClick The callback for when a word is clicked.
 * @returns An array of JSX elements.
 */
const renderInteractiveText = (text: string, onWordClick: (word: string) => void): (JSX.Element | string)[] => {
  // Enhanced regex that handles multiple markdown formats
  const parts = text.split(/(\*\*.*?\*\*|__.*?__|~~.*?~~|==.*?==|`.*?`|\[.*?\]\(.*?\)|\*.*?\*|_.*?_)/g).filter(Boolean);

  return parts.flatMap((part, i) => {
    // Bold text
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      const content = part.slice(2, -2);
      return <strong key={i}>{renderInteractiveText(content, onWordClick)}</strong>;
    }
    
    // Strikethrough text
    if (part.startsWith('~~') && part.endsWith('~~')) {
      const content = part.slice(2, -2);
      return <del key={i} style={{ textDecoration: 'line-through', opacity: 0.7 }}>{renderInteractiveText(content, onWordClick)}</del>;
    }
    
    // Highlight text
    if (part.startsWith('==') && part.endsWith('==')) {
      const content = part.slice(2, -2);
      return <mark key={i} style={{ backgroundColor: '#fff3cd', padding: '1px 2px', borderRadius: '2px' }}>{renderInteractiveText(content, onWordClick)}</mark>;
    }
    
    // Inline code
    if (part.startsWith('`') && part.endsWith('`')) {
      const content = part.slice(1, -1);
      return (
        <code key={i} style={{ 
          backgroundColor: '#f1f3f4', 
          padding: '2px 4px', 
          borderRadius: '3px', 
          fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: '0.9em',
          color: '#d73a49'
        }}>
          {content}
        </code>
      );
    }
    
    // Links
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const [, linkText, url] = linkMatch;
        return (
          <a key={i} 
             href={url} 
             target="_blank" 
             rel="noopener noreferrer"
             style={{ 
               color: '#1a73e8', 
               textDecoration: 'underline',
               cursor: 'pointer'
             }}
             onClick={(e) => {
               e.stopPropagation();
               // Don't trigger word click for links
             }}
          >
            {linkText}
          </a>
        );
      }
    }
    
    // Italic text (must come after bold to avoid conflicts)
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
 * Renders enhanced markdown content with interactive words.
 * Supports headers, lists, blockquotes, code blocks, tables, and more.
 */
const InteractiveContent: React.FC<{
  content: string;
  onWordClick: (word: string) => void;
}> = ({ content, onWordClick }) => {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let currentListItems: (JSX.Element | string)[][] = [];
  let currentOrderedListItems: (JSX.Element | string)[][] = [];
  let currentBlockquote: string[] = [];
  let currentCodeBlock: { language: string; lines: string[] } | null = null;
  let currentTable: string[][] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ paddingLeft: '1.5em', margin: '1em 0' }}>
          {currentListItems.map((item, i) => <li key={i} style={{ margin: '0.5em 0' }}>{item}</li>)}
        </ul>
      );
      currentListItems = [];
    }
    if (currentOrderedListItems.length > 0) {
      elements.push(
        <ol key={`ol-${elements.length}`} style={{ paddingLeft: '1.5em', margin: '1em 0' }}>
          {currentOrderedListItems.map((item, i) => <li key={i} style={{ margin: '0.5em 0' }}>{item}</li>)}
        </ol>
      );
      currentOrderedListItems = [];
    }
  };

  const flushBlockquote = () => {
    if (currentBlockquote.length > 0) {
      elements.push(
        <blockquote key={`bq-${elements.length}`} style={{ 
          borderLeft: '4px solid #dfe2e5', 
          paddingLeft: '1em', 
          margin: '1em 0', 
          color: '#6a737d',
          fontStyle: 'italic'
        }}>
          {currentBlockquote.map((line, i) => (
            <p key={i} style={{ margin: '0.5em 0' }}>
              {renderInteractiveText(line, onWordClick)}
            </p>
          ))}
        </blockquote>
      );
      currentBlockquote = [];
    }
  };

  const flushCodeBlock = () => {
    if (currentCodeBlock) {
      elements.push(
        <pre key={`code-${elements.length}`} style={{
          backgroundColor: '#f6f8fa',
          border: '1px solid #e1e4e8',
          borderRadius: '6px',
          padding: '16px',
          margin: '1em 0',
          overflow: 'auto',
          fontSize: '14px',
          lineHeight: '1.45'
        }}>
          <code style={{ 
            fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            color: '#24292e'
          }}>
            {currentCodeBlock.lines.join('\n')}
          </code>
        </pre>
      );
      currentCodeBlock = null;
    }
  };

  const flushTable = () => {
    if (currentTable.length > 0) {
      const [header, ...rows] = currentTable;
      elements.push(
        <table key={`table-${elements.length}`} style={{
          borderCollapse: 'collapse',
          width: '100%',
          margin: '1em 0',
          border: '1px solid #dfe2e5'
        }}>
          <thead>
            <tr>
              {header.map((cell, i) => (
                <th key={i} style={{
                  border: '1px solid #dfe2e5',
                  padding: '8px 12px',
                  backgroundColor: '#f6f8fa',
                  fontWeight: '600',
                  textAlign: 'left'
                }}>
                  {renderInteractiveText(cell, onWordClick)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} style={{
                    border: '1px solid #dfe2e5',
                    padding: '8px 12px'
                  }}>
                    {renderInteractiveText(cell, onWordClick)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      currentTable = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Code blocks
    if (trimmedLine.startsWith('```')) {
      if (currentCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        flushBlockquote();
        flushTable();
        const language = trimmedLine.substring(3).trim() || 'text';
        currentCodeBlock = { language, lines: [] };
      }
      return;
    }
    
    if (currentCodeBlock) {
      currentCodeBlock.lines.push(line);
      return;
    }
    
    // Tables
    if (trimmedLine.includes('|') && trimmedLine.split('|').length > 2) {
      flushList();
      flushBlockquote();
      const cells = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
      // Skip separator rows like |---|---|
      if (!cells.every(cell => cell.match(/^-+$/))) {
        currentTable.push(cells);
      }
      return;
    } else if (currentTable.length > 0) {
      flushTable();
    }
    
    // Blockquotes
    if (trimmedLine.startsWith('> ')) {
      flushList();
      flushTable();
      currentBlockquote.push(trimmedLine.substring(2));
      return;
    } else if (currentBlockquote.length > 0) {
      flushBlockquote();
    }
    
    // Ordered lists
    if (trimmedLine.match(/^\d+\. /)) {
      flushList();
      flushBlockquote();
      flushTable();
      currentOrderedListItems.push(renderInteractiveText(trimmedLine.replace(/^\d+\. /, ''), onWordClick));
      return;
    }
    
    // Unordered lists
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('+ ')) {
      flushBlockquote();
      flushTable();
      if (currentOrderedListItems.length > 0) {
        flushList();
      }
      currentListItems.push(renderInteractiveText(trimmedLine.substring(2), onWordClick));
      return;
    }
    
    // Headers
    flushList();
    flushBlockquote();
    flushTable();
    
    if (trimmedLine.startsWith('#### ')) {
      elements.push(<h4 key={index} style={{ margin: '1.5rem 0 0.5rem 0', fontSize: '1.1em', fontWeight: '600' }}>{renderInteractiveText(trimmedLine.substring(5), onWordClick)}</h4>);
    } else if (trimmedLine.startsWith('### ')) {
      elements.push(<h3 key={index} style={{ margin: '1.5rem 0 0.5rem 0', fontSize: '1.2em', fontWeight: '600' }}>{renderInteractiveText(trimmedLine.substring(4), onWordClick)}</h3>);
    } else if (trimmedLine.startsWith('## ')) {
      elements.push(<h2 key={index} style={{ margin: '1.5rem 0 0.5rem 0', fontSize: '1.4em', fontWeight: '600' }}>{renderInteractiveText(trimmedLine.substring(3), onWordClick)}</h2>);
    } else if (trimmedLine.startsWith('# ')) {
      elements.push(<h1 key={index} style={{ margin: '1.5rem 0 0.5rem 0', fontSize: '1.6em', fontWeight: '600' }}>{renderInteractiveText(trimmedLine.substring(2), onWordClick)}</h1>);
    } else if (trimmedLine === '---' || trimmedLine === '***') {
      // Horizontal rule
      elements.push(<hr key={index} style={{ border: 'none', borderTop: '1px solid #dfe2e5', margin: '2em 0' }} />);
    } else if (trimmedLine.length > 0) {
      // Regular paragraph
      elements.push(
        <p key={index} style={{ margin: '1em 0', lineHeight: '1.6' }}>
          {renderInteractiveText(line, onWordClick)}
        </p>
      );
    } else {
      // Empty line - add spacing
      elements.push(<div key={index} style={{ height: '0.5em' }} />);
    }
  });

  // Flush any remaining content
  flushList();
  flushBlockquote();
  flushCodeBlock();
  flushTable();

  return <>{elements}</>;
};

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, onWordClick }) => {
  if (content) {
    return <InteractiveContent content={content} onWordClick={onWordClick} />;
  }
  return null;
};

export default ContentDisplay;