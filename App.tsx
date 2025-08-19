/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { generateContentCardsStream, generateAsciiArt, AsciiArtData, CardData, CardStreamChunk } from './services/geminiService';
import Card from './components/Card';
import SearchBar from './components/SearchBar';
import LoadingSkeleton from './components/LoadingSkeleton';
import AsciiArtDisplay from './components/AsciiArtDisplay';

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
  // State to track the current topic and the previous one for context
  const [topicHistory, setTopicHistory] = useState<{ current: string; previous: string | null }>({ current: 'Hypertext', previous: null });
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState<AsciiArtData | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);


  useEffect(() => {
    if (!topicHistory.current) return;

    let isCancelled = false;
    const { current, previous } = topicHistory;

    // --- State Reset ---
    setIsLoading(true);
    setError(null);
    setCards([]); // Clear previous cards immediately
    setAsciiArt(null);
    setGenerationTime(null);
    const startTime = performance.now();

    // --- ASCII Art Generation (Concurrent) ---
    generateAsciiArt(current)
      .then(art => {
        if (!isCancelled) setAsciiArt(art);
      })
      .catch(err => {
        if (!isCancelled) {
          console.error("Failed to generate ASCII art:", err);
          const fallbackArt = createFallbackArt(current);
          setAsciiArt(fallbackArt);
        }
      });
    
    // --- Content Streaming ---
    const streamContent = async () => {
      try {
        const handleChunk = (chunk: CardStreamChunk) => {
          if (isCancelled) return;
          if (isLoading) setIsLoading(false); // Turn off skeleton on first chunk

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

        await generateContentCardsStream(current, previous, handleChunk);

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
          setGenerationTime(endTime - startTime);
          setIsLoading(false); // Ensure loading is off when stream finishes or fails
        }
      }
    };

    streamContent();
    
    return () => {
      isCancelled = true;
    };
  }, [topicHistory]); // Re-run effect when topicHistory changes

  // When a word is clicked, the current topic becomes the previous one.
  const handleWordClick = useCallback((word: string) => {
    const newTopic = word.trim();
    if (newTopic && newTopic.toLowerCase() !== topicHistory.current.toLowerCase()) {
      setTopicHistory({ current: newTopic, previous: topicHistory.current });
    }
  }, [topicHistory.current]);

  // A new search starts a fresh topic thread (no previous topic).
  const handleSearch = useCallback((topic: string) => {
    const newTopic = topic.trim();
    if (newTopic && newTopic.toLowerCase() !== topicHistory.current.toLowerCase()) {
      setTopicHistory({ current: newTopic, previous: null });
    }
  }, [topicHistory.current]);

  // A random word also starts a fresh topic thread.
  const handleRandom = useCallback(() => {
    setIsLoading(true); // Disable UI immediately
    setError(null);
    setCards([]);
    setAsciiArt(null);

    const randomIndex = Math.floor(Math.random() * UNIQUE_WORDS.length);
    let randomWord = UNIQUE_WORDS[randomIndex];

    // Prevent picking the same word twice in a row
    if (randomWord.toLowerCase() === topicHistory.current.toLowerCase()) {
      const nextIndex = (randomIndex + 1) % UNIQUE_WORDS.length;
      randomWord = UNIQUE_WORDS[nextIndex];
    }
    setTopicHistory({ current: randomWord, previous: null });
  }, [topicHistory.current]);

  const handleGoToPrevious = (topic: string) => {
    // This provides a simple one-level-back navigation
    setTopicHistory({ current: topic, previous: null });
  };


  return (
    <div>
      <SearchBar onSearch={handleSearch} onRandom={handleRandom} isLoading={isLoading} />
      
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          INFINITE WIKI
        </h1>
        <AsciiArtDisplay artData={asciiArt} topic={topicHistory.current} />
      </header>
      
      <main>
        <div>
          <h2 style={{ marginBottom: '2rem', textTransform: 'capitalize' }}>
            {topicHistory.previous ? (
              <>
                <button onClick={() => handleGoToPrevious(topicHistory.previous!)} className="topic-history-link" aria-label={`Go back to ${topicHistory.previous}`}>
                  {topicHistory.previous}
                </button>
                <span style={{ margin: '0 0.5em', userSelect: 'none' }}>→</span>
                {topicHistory.current}
              </>
            ) : (
              topicHistory.current
            )}
          </h2>

          {error && (
            <div style={{ border: '1px solid #cc0000', padding: '1rem', color: '#cc0000' }}>
              <p style={{ margin: 0 }}>An Error Occurred</p>
              <p style={{ marginTop: '0.5rem', margin: 0 }}>{error}</p>
            </div>
          )}
          
          {isLoading && !error && (
            <LoadingSkeleton />
          )}

          {!isLoading && !error && (
            <div className="card-container">
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
          Infinite Wiki by <a href="https://x.com/dev_valladares" target="_blank" rel="noopener noreferrer">Dev Valladares</a> · Generated by Gemini 2.5 Flash
          {generationTime && ` · ${Math.round(generationTime)}ms`}
        </p>
      </footer>
    </div>
  );
};

export default App;