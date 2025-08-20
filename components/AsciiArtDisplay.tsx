/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import type { AsciiArtData } from '../services/geminiService';

interface AsciiArtDisplayProps {
  artData: AsciiArtData | null;
  topic: string;
  isStreaming?: boolean;
  streamingContent?: string;
}

const AsciiArtDisplay: React.FC<AsciiArtDisplayProps> = ({ artData, topic, isStreaming: isStreamingProp = false, streamingContent = '' }) => {
  const [visibleContent, setVisibleContent] = useState<string>('*'); // Start with placeholder
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [lastProcessedArt, setLastProcessedArt] = useState<string | null>(null);

  useEffect(() => {
    if (isStreamingProp) {
      // Real-time streaming: display content as it arrives
      setVisibleContent(streamingContent);
      setIsStreaming(true);
    } else if (artData) {
      const fullText = artData.text ? `${artData.art}\n\n${artData.text}` : artData.art;
      
      // Check if this is the same content we've already processed
      if (lastProcessedArt === fullText) {
        // Content hasn't changed, just display it immediately
        setVisibleContent(fullText);
        setIsStreaming(false);
        return;
      }
      
      // New content, display immediately (no fake animation)
      setVisibleContent(fullText);
      setIsStreaming(false);
      setLastProcessedArt(fullText);
    } else {
      // If artData is null, reset to the placeholder.
      setVisibleContent('*');
      setIsStreaming(false);
      setLastProcessedArt(null);
    }
  }, [artData, isStreamingProp, streamingContent]);

  const accessibilityLabel = `ASCII art for ${topic}`;

  return (
    <pre className="ascii-art" aria-label={accessibilityLabel}>
      {visibleContent}
      {isStreaming && <span className="blinking-cursor">|</span>}
    </pre>
  );
};

export default AsciiArtDisplay;