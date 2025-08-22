/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { TopicNode } from '../hooks/useTopicHistory';
import AsciiArtDisplay from './AsciiArtDisplay';
import Card from './Card';

interface OnePageViewProps {
  nodes: Record<string, TopicNode>;
  onWordClick: (word: string) => void;
  onSwitchToNormalMode?: () => void;
  relatedQuestions?: Record<string, string[]>;
}

const OnePageView: React.FC<OnePageViewProps> = ({ nodes, onWordClick, onSwitchToNormalMode, relatedQuestions = {} }) => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = document.documentElement.scrollTop;
      setShowBackToTop(scrolled > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  const handleWordClick = (word: string) => {
    // When clicking in one-page mode, switch to normal mode and navigate
    if (onSwitchToNormalMode) {
      onSwitchToNormalMode();
    }
    onWordClick(word);
  };
  // Get all nodes sorted by timestamp (chronological order)
  const sortedNodes = Object.values(nodes)
    .filter((node: TopicNode) => node.cachedCards && node.cachedAsciiArt) // Only show nodes with content
    .sort((a: TopicNode, b: TopicNode) => a.timestamp - b.timestamp);

  if (sortedNodes.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        color: '#666'
      }}>
        <p>No content available yet. Start exploring topics to see them here!</p>
      </div>
    );
  }

  return (
    <div className="one-page-view" style={{ 
      padding: '1rem',
      paddingBottom: '80px',
      width: '100%'
    }}>
      <div style={{
        marginBottom: '1.5rem',
        textAlign: 'center',
        borderBottom: '1px solid #e0e0e0',
        paddingBottom: '0.75rem'
      }}>
      </div>

      {sortedNodes.map((node: TopicNode, index: number) => (
        <div 
          key={node.id} 
          id={`node-${node.id}`}
          className="node-section"
          style={{
            marginBottom: index < sortedNodes.length - 1 ? '2.5rem' : '1rem',
            borderBottom: index < sortedNodes.length - 1 ? '1px solid #f0f0f0' : 'none',
            paddingBottom: index < sortedNodes.length - 1 ? '1.5rem' : '0',
            scrollMarginTop: '2rem'
          }}
        >
          {/* Topic Header */}
          <div style={{
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <h3 style={{
              margin: '0 0 0.5rem 0',
              fontSize: '1.5em',
              color: '#333',
              fontWeight: 'bold'
            }}>
              {node.topic}
            </h3>
          </div>

          {/* ASCII Art Section */}
          {node.cachedAsciiArt && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '2rem',
              padding: '1rem',
              background: '#fafafa',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <AsciiArtDisplay artData={node.cachedAsciiArt} topic={node.topic} />
            </div>
          )}

          {/* Content Cards */}
          {node.cachedCards && node.cachedCards.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              alignItems: 'start'
            }}>
              {node.cachedCards
                .filter(card => card.title || card.content)
                .map((card, cardIndex) => (
                  <Card
                    key={`${node.id}-${cardIndex}`}
                    title={card.title}
                    content={card.content}
                    onWordClick={handleWordClick}
                    relatedQuestions={relatedQuestions}
                  />
                ))}
            </div>
          )}
        </div>
      ))}
      
      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            zIndex: 1000
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#0056b3'}
          onMouseOut={(e) => e.currentTarget.style.background = '#007bff'}
          title="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default OnePageView;
