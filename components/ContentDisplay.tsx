/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { JSX, useState, useRef } from 'react';
import HoverPopup from './HoverPopup';

interface ContentDisplayProps {
  content: string;
  onWordClick: (word: string) => void;
  relatedQuestions?: Record<string, string[]>;
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
const renderInteractiveText = (
  text: string, 
  onWordClick: (word: string) => void,
  onWordHover: (word: string, event: React.MouseEvent) => void,
  onWordLeave: () => void
): (JSX.Element | string)[] => {
  // Enhanced regex that properly handles multiple instances and nested content
  const parts = text.split(/(\*\*[^*]+?\*\*|__[^_]+?__|~~[^~]+?~~|==[\s\S]*?==|`[^`]+?`|\[[^\]]+?\]\([^)]+?\)|\*[^*\s][^*]*?\*|_[^_\s][^_]*?_)/g).filter(Boolean);

  return parts.flatMap((part, i) => {
    // Bold text - CLICKABLE AS ENTIRE UNIT
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      const content = part.slice(2, -2);
      return (
        <strong 
          key={i} 
          onClick={() => onWordClick(content)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
            onWordHover(content, e);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            onWordLeave();
          }}
          style={{ 
            cursor: 'pointer',
            padding: '1px 2px',
            borderRadius: '2px',
            transition: 'background-color 0.2s'
          }}
        >
          {content}
        </strong>
      );
    }
    
    // Strikethrough text - CLICKABLE AS ENTIRE UNIT
    if (part.startsWith('~~') && part.endsWith('~~')) {
      const content = part.slice(2, -2);
      return (
        <del 
          key={i} 
          onClick={() => onWordClick(content)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
            onWordHover(content, e);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            onWordLeave();
          }}
          style={{ 
            textDecoration: 'line-through', 
            opacity: 0.7,
            cursor: 'pointer',
            padding: '1px 2px',
            borderRadius: '2px',
            transition: 'background-color 0.2s'
          }}
        >
          {content}
        </del>
      );
    }
    
    // Highlight text - CLICKABLE AS ENTIRE UNIT
    if (part.startsWith('==') && part.endsWith('==')) {
      const content = part.slice(2, -2);
      return (
        <mark 
          key={i} 
          onClick={() => onWordClick(content)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffe066';
            onWordHover(content, e);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff3cd';
            onWordLeave();
          }}
          style={{ 
            backgroundColor: '#fff3cd', 
            padding: '1px 2px', 
            borderRadius: '2px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {renderInteractiveText(content, onWordClick, onWordHover, onWordLeave)}
        </mark>
      );
    }
    
    // Inline code - CLICKABLE AS ENTIRE UNIT
    if (part.startsWith('`') && part.endsWith('`')) {
      const content = part.slice(1, -1);
      return (
        <code 
          key={i} 
          onClick={() => onWordClick(content)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e8eaed';
            onWordHover(content, e);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f3f4';
            onWordLeave();
          }}
          style={{ 
            backgroundColor: '#f1f3f4', 
            padding: '2px 4px', 
            borderRadius: '3px', 
            fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '0.9em',
            color: '#d73a49',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {content}
        </code>
      );
    }
    
    // Links - CLICKABLE AS ENTIRE UNIT
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const [, linkText, url] = linkMatch;
        return (
          <a key={i} 
             href="#"
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               onWordClick(linkText);
             }}
             onMouseEnter={(e) => {
               e.currentTarget.style.backgroundColor = '#f0f0f0';
               onWordHover(linkText, e);
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.backgroundColor = 'transparent';
               onWordLeave();
             }}
             style={{ 
               color: '#1a73e8', 
               textDecoration: 'underline',
               cursor: 'pointer',
               padding: '1px 2px',
               borderRadius: '2px',
               transition: 'background-color 0.2s'
             }}
          >
            {linkText}
          </a>
        );
      }
    }
    
    // Italic text - CLICKABLE AS ENTIRE UNIT (must come after bold to avoid conflicts)
    if ((part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) || 
        (part.startsWith('_') && part.endsWith('_') && !part.startsWith('__'))) {
      const content = part.slice(1, -1);
      return (
        <em 
          key={i}
          onClick={() => onWordClick(content)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
            onWordHover(content, e);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            onWordLeave();
          }}
          style={{ 
            cursor: 'pointer',
            padding: '1px 2px',
            borderRadius: '2px',
            transition: 'background-color 0.2s'
          }}
        >
          {content}
        </em>
      );
    }

    // For plain text parts, return as non-clickable text
    return part;
  });
};

/**
 * Post-processes elements to handle card and flex containers
 */
const processCardAndFlexElements = (elements: JSX.Element[]): JSX.Element[] => {
  const result: JSX.Element[] = [];
  let i = 0;
  
  while (i < elements.length) {
    const element = elements[i];
    
    // Check for flex container start
    if (element.props && element.props['data-flex-start']) {
      const direction = element.props['data-flex-start'];
      const gap = element.props['data-gap'] || '1rem';
      
      // Find the matching flex end
      let flexContent: JSX.Element[] = [];
      i++; // Skip the flex start marker
      
      while (i < elements.length) {
        const currentElement = elements[i];
        if (currentElement.props && currentElement.props['data-flex-end']) {
          break; // Found flex end
        }
        flexContent.push(currentElement);
        i++;
      }
      
      // Create flex container
      result.push(
        <div key={`flex-container-${result.length}`} className="bento-flex-container" style={{
          display: 'flex',
          flexDirection: direction,
          gap: gap,
          margin: '1rem 0',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          width: '100%'
        }}>
          {processCardAndFlexElements(flexContent)}
        </div>
      );
    }
    // Check for card start
    else if (element.props && element.props['data-card-start']) {
      const cardType = element.props['data-card-start'];
      const isFlexCard = cardType === 'flex';
      
      // Find the matching card end
      let cardContent: JSX.Element[] = [];
      i++; // Skip the card start marker
      
      while (i < elements.length) {
        const currentElement = elements[i];
        if (currentElement.props && currentElement.props['data-card-end']) {
          break; // Found card end
        }
        cardContent.push(currentElement);
        i++;
      }
      
      // Create card container
      result.push(
        <div key={`card-container-${result.length}`} className={isFlexCard ? 'bento-card flex' : 'bento-card'} style={{
          background: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '1.5rem',
          margin: '0.5rem 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          flex: isFlexCard ? '1 1 auto' : 'none',
          minWidth: isFlexCard ? '200px' : 'auto',
          maxWidth: '100%',
          overflow: 'hidden',
          wordWrap: 'break-word'
        }}>
          <div className="card-content">
            {processCardAndFlexElements(cardContent)}
          </div>
        </div>
      );
    }
    // Regular element
    else {
      result.push(element);
    }
    
    i++;
  }
  
  return result;
};

/**
 * Renders enhanced markdown content with interactive words.
 * Supports headers, lists, blockquotes, code blocks, tables, and more.
 */
const InteractiveContent: React.FC<{
  content: string;
  onWordClick: (word: string) => void;
  onWordHover: (word: string, event: React.MouseEvent) => void;
  onWordLeave: () => void;
}> = ({ content, onWordClick, onWordHover, onWordLeave }) => {
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
              {renderInteractiveText(line, onWordClick, onWordHover, onWordLeave)}
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
        <pre key={`pre-${elements.length}`} style={{ 
          backgroundColor: '#f6f8fa', 
          padding: '1em', 
          borderRadius: '6px', 
          overflow: 'auto',
          margin: '1em 0',
          border: '1px solid #e1e4e8'
        }}>
          <code style={{ 
            fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '0.9em'
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
      elements.push(
        <table key={`table-${elements.length}`} style={{ 
          borderCollapse: 'collapse', 
          width: '100%', 
          margin: '1em 0',
          border: '1px solid #dfe2e5'
        }}>
          <tbody>
            {currentTable.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #dfe2e5' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ 
                    padding: '0.75em', 
                    borderRight: j < row.length - 1 ? '1px solid #dfe2e5' : 'none',
                    textAlign: 'left'
                  }}>
                    {renderInteractiveText(cell, onWordClick, onWordHover, onWordLeave)}
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
    
    // Card tags - <card> or <card flex>
    if (trimmedLine.startsWith('<card') && trimmedLine.endsWith('>')) {
      flushList();
      flushBlockquote();
      flushTable();
      
      // Parse card attributes
      const isFlexCard = trimmedLine.includes('flex');
      
      // Mark that we're starting a card (we'll collect content until </card>)
      elements.push(<div key={`card-marker-${index}`} data-card-start={isFlexCard ? 'flex' : 'normal'} />);
      return;
    }
    
    // Card end tag - we'll process this differently
    if (trimmedLine === '</card>') {
      elements.push(<div key={`card-end-${index}`} data-card-end="true" />);
      return;
    }
    
    // Flexbox container
    if (trimmedLine.startsWith('<flex') && trimmedLine.endsWith('>')) {
      flushList();
      flushBlockquote();
      flushTable();
      
      // Parse flex attributes
      const direction = trimmedLine.includes('column') ? 'column' : 'row';
      const gap = trimmedLine.includes('gap-') ? 
        trimmedLine.match(/gap-(\d+)/)?.[1] + 'px' : '1rem';
      
      elements.push(<div key={`flex-marker-${index}`} data-flex-start={direction} data-gap={gap} />);
      return;
    }
    
    // Flexbox end tag
    if (trimmedLine === '</flex>') {
      elements.push(<div key={`flex-end-${index}`} data-flex-end="true" />);
      return;
    }
    
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
      // Skip separator rows like |---|---| or |:---:|:---:| or |:-----|-----:| or |:-------------:|
      const isSeparatorRow = cells.every(cell => 
        cell.match(/^:?-+:?$/) || // Standard separators
        cell.match(/^:-+$/) ||    // Left aligned
        cell.match(/^-+:$/) ||    // Right aligned
        cell.match(/^:-+:$/)      // Center aligned
      );
      
      if (!isSeparatorRow) {
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
      currentOrderedListItems.push(renderInteractiveText(trimmedLine.replace(/^\d+\. /, ''), onWordClick, onWordHover, onWordLeave));
      return;
    }
    
    // Unordered lists
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('+ ')) {
      flushBlockquote();
      flushTable();
      if (currentOrderedListItems.length > 0) {
        flushList();
      }
      currentListItems.push(renderInteractiveText(trimmedLine.substring(2), onWordClick, onWordHover, onWordLeave));
      return;
    }
    
    // Headers
    flushList();
    flushBlockquote();
    flushTable();
    
    if (trimmedLine.startsWith('#### ')) {
      elements.push(<h4 key={index} style={{ margin: '1.5rem 0 0.5rem 0', fontSize: '1.1em', fontWeight: '600' }}>{renderInteractiveText(trimmedLine.substring(5), onWordClick, onWordHover, onWordLeave)}</h4>);
    } else if (trimmedLine.startsWith('### ')) {
      elements.push(<h3 key={index} style={{ margin: '1.5rem 0 0.5rem 0', fontSize: '1.2em', fontWeight: '600' }}>{renderInteractiveText(trimmedLine.substring(4), onWordClick, onWordHover, onWordLeave)}</h3>);
    } else if (trimmedLine.startsWith('## ')) {
      elements.push(<h2 key={index} style={{ margin: '1.5rem 0 0.5rem 0', fontSize: '1.4em', fontWeight: '600' }}>{renderInteractiveText(trimmedLine.substring(3), onWordClick, onWordHover, onWordLeave)}</h2>);
    } else if (trimmedLine.startsWith('# ')) {
      elements.push(<h1 key={index} style={{ margin: '1.5rem 0 0.5rem 0', fontSize: '1.6em', fontWeight: '600' }}>{renderInteractiveText(trimmedLine.substring(2), onWordClick, onWordHover, onWordLeave)}</h1>);
    } else if (trimmedLine === '---' || trimmedLine === '***') {
      // Horizontal rule
      elements.push(<hr key={index} style={{ border: 'none', borderTop: '1px solid #dfe2e5', margin: '2em 0' }} />);
    } else if (trimmedLine.length > 0) {
      // Regular paragraph
      elements.push(
        <p key={index} style={{ margin: '1em 0', lineHeight: '1.6' }}>
          {renderInteractiveText(line, onWordClick, onWordHover, onWordLeave)}
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

  // Post-process to handle card and flex containers
  const processedElements = processCardAndFlexElements(elements);

  return <>{processedElements}</>;
};

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, onWordClick, relatedQuestions = {} }) => {
  const [hoverState, setHoverState] = useState<{
    word: string;
    position: { x: number; y: number };
    isVisible: boolean;
  }>({
    word: '',
    position: { x: 0, y: 0 },
    isVisible: false
  });
  
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleWordHover = (word: string, event: React.MouseEvent) => {
    // Clear any existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setHoverState({
      word: word,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      },
      isVisible: true
    });
  };

  const handleWordLeave = () => {
    // Delay hiding to allow mouse to move to popup
    hideTimeoutRef.current = setTimeout(() => {
      setHoverState(prev => ({ ...prev, isVisible: false }));
    }, 50);
  };

  const handlePopupEnter = () => {
    // Clear hide timeout when mouse enters popup
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handlePopupLeave = () => {
    // Hide popup when mouse leaves popup
    hideTimeoutRef.current = setTimeout(() => {
      setHoverState(prev => ({ ...prev, isVisible: false }));
    }, 50);
  };

  const handleQuestionClick = (question: string) => {
    // Hide popup and trigger word click with the question
    setHoverState(prev => ({ ...prev, isVisible: false }));
    onWordClick(question);
  };

  if (content) {
    return (
      <div style={{ position: 'relative' }}>
        <InteractiveContent 
          content={content} 
          onWordClick={onWordClick}
          onWordHover={handleWordHover}
          onWordLeave={handleWordLeave}
        />
        <HoverPopup
          word={hoverState.word}
          position={hoverState.position}
          isVisible={hoverState.isVisible}
          onQuestionClick={handleQuestionClick}
          onMouseEnter={handlePopupEnter}
          onMouseLeave={handlePopupLeave}
          preGeneratedQuestions={relatedQuestions[hoverState.word] || []}
        />
      </div>
    );
  }
  return null;
};

export default ContentDisplay;