/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { generateContentCardsStream, generateAsciiArt, AsciiArtData, CardData, CardStreamChunk } from './services/openRouterService';
import Card from './components/Card';
import SearchBar from './components/SearchBar';
import LoadingSkeleton from './components/LoadingSkeleton';
import AsciiArtDisplay from './components/AsciiArtDisplay';
import TopicOutline from './components/TopicOutline';
import { useTopicHistory } from './hooks/useTopicHistory';

// A curated list of "banger" words and phrases for the random button.
const PREDEFINED_WORDS = [
  // List 1
  'Balance', 'Harmony', 'Discord', 'Unity', 'Fragmentation', 'Clarity', 'Ambiguity', 'Presence', 'Absence', 'Creation', 'Destruction', 'Light', 'Shadow', 'Beginning', 'Ending', 'Rising', 'Falling', 'Connection', 'Isolation', 'Hope', 'Despair',
  // Complex phrases from List 1
  'Order and chaos', 'Light and shadow', 'Sound and silence', 'Form and formlessness', 'Being and nonbeing', 'Presence and absence', 'Motion and stillness', 'Unity and multiplicity', 'Finite and infinite', 'Sacred and profane', 'Memory and forgetting', 'Question and answer', 'Search and discovery', 'Journey and destination', 'Dream and reality', 'Time and eternity', 'Self and other', 'Known and unknown', 'Spoken and unspoken', 'Visible and invisible',
  // List 2
  'Zigzag', 'Waves', 'Spiral', 'Bounce', 'Slant', 'Drip', 'Stretch', 'Squeeze', 'Float', 'Fall', 'Spin', 'Melt', 'Rise', 'Twist', 'Explode', 'Stack', 'Mirror', 'Echo', 'Vibrate',
  // List 3
  'Gravity', 'Friction', 'Momentum', 'Inertia', 'Turbulence', 'Pressure', 'Tension', 'Oscillate', 'Fractal', 'Quantum', 'Entropy', 'Vortex', 'Resonance', 'Equilibrium', 'Centrifuge', 'Elastic', 'Viscous', 'Refract', 'Diffuse', 'Cascade', 'Levitate', 'Magnetize', 'Polarize', 'Accelerate', 'Compress', 'Undulate',
  // List 4
  'Liminal', 'Ephemeral', 'Paradox', 'Zeitgeist', 'Metamorphosis', 'Synesthesia', 'Recursion', 'Emergence', 'Dialectic', 'Apophenia', 'Limbo', 'Flux', 'Sublime', 'Uncanny', 'Palimpsest', 'Chimera', 'Void', 'Transcend', 'Ineffable', 'Qualia', 'Gestalt', 'Simulacra', 'Abyssal',
  // List 5
  'Existential', 'Nihilism', 'Solipsism', 'Phenomenology', 'Hermeneutics', 'Deconstruction', 'Postmodern', 'Absurdism', 'Catharsis', 'Epiphany', 'Melancholy', 'Nostalgia', 'Longing', 'Reverie', 'Pathos', 'Ethos', 'Logos', 'Mythos', 'Anamnesis', 'Intertextuality', 'Metafiction', 'Stream', 'Lacuna', 'Caesura', 'Enjambment'
];
const UNIQUE_WORDS = [...new Set(PREDEFINED_WORDS)];


/**
 * Creates a simple ASCII art bounding box as a fallback.
 * @param topic The text to display inside the box.
 * @returns An AsciiArtData object with the generated art.
 */
const createFallbackArt = (topic: string): AsciiArtData => {
  const displayableTopic = topic.length > 20 ? topic.substring(0, 17) + '...' : topic;
  const paddedTopic = ` ${displayableTopic} `;
  const topBorder = `┌${'─'.repeat(paddedTopic.length)}┐`;
  const middle = `│${paddedTopic}│`;
  const bottomBorder = `└${'─'.repeat(paddedTopic.length)}┘`;
  return {
    art: `${topBorder}\n${middle}\n${bottomBorder}`
  };
};

const App: React.FC = () => {
  const {
    history: topicHistoryState,
    addTopic,
    navigateToNode,
    getCurrentNode,
    getNodePath,
    updateNodeContent,
    clearHistory
  } = useTopicHistory();
  
  const [currentTopic, setCurrentTopic] = useState<string>('Hypertext');
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState<AsciiArtData | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [totalInputWords, setTotalInputWords] = useState<number>(0);
  const [totalOutputWords, setTotalOutputWords] = useState<number>(0);
  const [currentContentWords, setCurrentContentWords] = useState<number>(0);
  
  // Initialize first topic if no history exists
  useEffect(() => {
    if (Object.keys(topicHistoryState.nodes).length === 0) {
      addTopic('Hypertext');
    } else {
      const currentNode = getCurrentNode();
      if (currentNode) {
        setCurrentTopic(currentNode.topic);
      }
    }
  }, []);


  useEffect(() => {
    if (!currentTopic) return;

    let isCancelled = false;
    const currentNode = getCurrentNode();
    
    // Check if we have cached content for this node
    if (currentNode && currentNode.cachedCards && currentNode.cachedAsciiArt) {
      // Load from cache without calling AI
      setCards(currentNode.cachedCards);
      setAsciiArt(currentNode.cachedAsciiArt);
      setGenerationTime(currentNode.generationTime || null);
      setIsLoading(false);
      setError(null);
      setCurrentContentWords(
        currentNode.cachedCards.reduce((sum, card) => 
          sum + (card.content || '').split(/\s+/).length, 0
        )
      );
      return;
    }
    
    const path = currentNode ? getNodePath(currentNode.id) : [];
    const previousTopic = path.length > 1 ? path[path.length - 2].topic : null;

    // --- State Reset ---
    setIsLoading(true);
    setError(null);
    setCards([]); // Clear previous cards immediately
    setAsciiArt(null);
    setGenerationTime(null);
    const startTime = performance.now();
    
    // Track input words for this request
    let sessionInputWords = 0;
    let sessionOutputWords = 0;
    setCurrentContentWords(0); // Reset current content word count

    // --- ASCII Art Generation (Concurrent) ---
    generateAsciiArt(currentTopic)
      .then(art => {
        if (!isCancelled) {
          setAsciiArt(art);
          // Estimate ASCII art generation words (prompt + response)
          const artPromptWords = 50; // Approximate words in ASCII art prompt
          const artOutputWords = art.art.split(/\s+/).length;
          sessionInputWords += artPromptWords;
          sessionOutputWords += artOutputWords;
          setTotalInputWords(prev => prev + artPromptWords);
          setTotalOutputWords(prev => prev + artOutputWords);
        }
      })
      .catch(err => {
        if (!isCancelled) {
          console.error("Failed to generate ASCII art:", err);
          const fallbackArt = createFallbackArt(currentTopic);
          setAsciiArt(fallbackArt);
        }
      });
    
    // --- Content Streaming ---
    const streamContent = async () => {
      try {
        // Estimate content prompt words
        const contentPromptWords = previousTopic ? 80 : 60; // Approximate words in content prompts
        sessionInputWords += contentPromptWords;
        setTotalInputWords(prev => prev + contentPromptWords);
        
        let streamedContent = '';
        
        const handleChunk = (chunk: CardStreamChunk) => {
          if (isCancelled) return;
          if (isLoading) setIsLoading(false); // Turn off skeleton on first chunk

          // Track output words
          if (chunk.type === 'title' || chunk.type === 'content') {
            streamedContent += chunk.value + ' ';
            const words = chunk.value.split(/\s+/).filter(w => w.length > 0).length;
            sessionOutputWords += words;
            setTotalOutputWords(prev => prev + words);
            setCurrentContentWords(prev => prev + words);
          }

          setCards(prev => {
            let newCards = [...prev];
            // Ensure there's a card to work on
            if (newCards.length === 0) {
              newCards.push({ title: '', content: '' });
            }
            let currentCard = newCards[newCards.length - 1];

            switch(chunk.type) {
              case 'title':
                currentCard.title = chunk.value;
                break;
              case 'content':
                currentCard.content += chunk.value;
                break;
              case 'separator':
                // The next chunk will be a title for a new card
                newCards.push({ title: '', content: '' });
                break;
            }
            return newCards;
          });
        };

        await generateContentCardsStream(currentTopic, previousTopic, handleChunk);

      } catch (e: unknown) {
        if (!isCancelled) {
          const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
          setError(errorMessage);
          setCards([]); // Ensure cards are clear on error
          console.error(e);
        }
      } finally {
        if (!isCancelled) {
          const endTime = performance.now();
          const generationTime = endTime - startTime;
          setGenerationTime(generationTime);
          setIsLoading(false); // Ensure loading is off when stream finishes or fails
        }
      }
    };

    streamContent();
    
    return () => {
      isCancelled = true;
    };
  }, [currentTopic, topicHistoryState.currentNodeId]); // Re-run effect when topic changes

  // Cache content when generation completes
  useEffect(() => {
    const currentNode = getCurrentNode();
    if (currentNode && cards.length > 0 && asciiArt && !isLoading && !currentNode.cachedCards) {
      updateNodeContent(currentNode.id, {
        cards: cards,
        asciiArt: asciiArt,
        generationTime: generationTime || undefined,
      });
    }
  }, [cards, asciiArt, isLoading, generationTime, getCurrentNode, updateNodeContent]);

  // When a word is clicked, add it as a child of current node
  const handleWordClick = useCallback((word: string) => {
    const newTopic = word.trim();
    if (newTopic && newTopic.toLowerCase() !== currentTopic.toLowerCase()) {
      const currentNodeId = topicHistoryState.currentNodeId;
      addTopic(newTopic, currentNodeId);
      setCurrentTopic(newTopic);
    }
  }, [currentTopic, topicHistoryState.currentNodeId, addTopic]);

  // A new search starts a fresh topic thread (new root node)
  const handleSearch = useCallback((topic: string) => {
    const newTopic = topic.trim();
    if (newTopic && newTopic.toLowerCase() !== currentTopic.toLowerCase()) {
      addTopic(newTopic, null); // null means it's a root node
      setCurrentTopic(newTopic);
    }
  }, [currentTopic, addTopic]);

  // A random word also starts a fresh topic thread
  const handleRandom = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setCards([]);
    setAsciiArt(null);

    const randomIndex = Math.floor(Math.random() * UNIQUE_WORDS.length);
    let randomWord = UNIQUE_WORDS[randomIndex];

    if (randomWord.toLowerCase() === currentTopic.toLowerCase()) {
      const nextIndex = (randomIndex + 1) % UNIQUE_WORDS.length;
      randomWord = UNIQUE_WORDS[nextIndex];
    }
    addTopic(randomWord, null);
    setCurrentTopic(randomWord);
  }, [currentTopic, addTopic]);

  const handleNavigateToHistoryNode = useCallback((nodeId: string) => {
    navigateToNode(nodeId);
    const node = topicHistoryState.nodes[nodeId];
    if (node) {
      setCurrentTopic(node.topic);
      
      // Load cached content if available
      if (node.cachedCards && node.cachedAsciiArt) {
        setCards(node.cachedCards);
        setAsciiArt(node.cachedAsciiArt);
        setGenerationTime(node.generationTime || null);
        setIsLoading(false);
        setError(null);
        
        // Restore word counts
        if (node.totalInputWords) {
          setTotalInputWords(prev => prev + node.totalInputWords!);
        }
        if (node.totalOutputWords) {
          setTotalOutputWords(prev => prev + node.totalOutputWords!);
        }
      }
    }
  }, [navigateToNode, topicHistoryState.nodes]);

  const handleSectionClick = (index: number) => {
    // Scroll to the corresponding card
    const cardElements = document.querySelectorAll('.card');
    if (cardElements[index]) {
      cardElements[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };


  return (
    <div>
      <SearchBar onSearch={handleSearch} onRandom={handleRandom} isLoading={isLoading} />
      

      
      <main className="app-container" style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 120px)' }}>
        <aside className="sidebar" style={{ 
          width: '260px', 
          flexShrink: 0, 
          overflow: 'hidden',
          backgroundColor: 'transparent',
          border: 'none',
          height: '100%',
          display: 'flex',
          alignItems: 'center'
        }}>
          <TopicOutline
            historyNodes={topicHistoryState.nodes}
            currentNodeId={topicHistoryState.currentNodeId}
            rootNodeIds={topicHistoryState.rootNodeIds}
            onNavigateToNode={handleNavigateToHistoryNode}
            onClearHistory={clearHistory}
          />
        </aside>
        
        <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div className="content-header" style={{ marginBottom: '1rem' }}>
            
            <div className="ascii-art-section" style={{ 
              display: 'flex', 
              justifyContent: 'center',
              marginBottom: '1rem',
              padding: '1rem',
              background: '#fafafa',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <AsciiArtDisplay artData={asciiArt} topic={currentTopic} />
            </div>
          </div>

          {error && (
            <div style={{ border: '1px solid #cc0000', padding: '1rem', color: '#cc0000', marginBottom: '1rem' }}>
              <p style={{ margin: 0 }}>An Error Occurred</p>
              <p style={{ marginTop: '0.5rem', margin: 0 }}>{error}</p>
            </div>
          )}
          
          {isLoading && !error && (
            <LoadingSkeleton />
          )}

          {!isLoading && !error && (
            <div className="card-container" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
              alignItems: 'start'
            }}>
              {cards.filter(card => card.title || card.content).map((card, index) => (
                <Card 
                  key={index}
                  title={card.title}
                  content={card.content}
                  onWordClick={handleWordClick}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="sticky-footer">
        <p className="footer-text" style={{ margin: 0 }}>
          Infinite Wiki by <a href="https://x.com/dev_valladares" target="_blank" rel="noopener noreferrer">Dev Valladares</a> · Generated via OpenRouter (Gemini 2.5 Flash Lite)
          {generationTime && ` · ${Math.round(generationTime)}ms`}
          {totalInputWords > 0 && ` · Est. cost: $${((totalInputWords / 1000000 * 0.1) + (totalOutputWords / 1000000 * 0.4)).toFixed(6)}`}
        </p>
      </footer>
    </div>
  );
};

export default App;