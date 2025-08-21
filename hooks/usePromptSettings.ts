/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect } from 'react';

interface PromptSettings {
  contentPrompt: string;
  modifyPrompt: string;
  asciiPrompt: string;
}

const DEFAULT_PROMPTS: PromptSettings = {
  contentPrompt: `You are a surreal, infinite encyclopedia. For the term "{topic}", provide few distinct sections that give a concise, encyclopedia-style definition from different perspectives.

IMPORTANT: Use rich markdown formatting and new bento layout features:

MARKDOWN FORMATTING:
- Use **bold** for key terms and important concepts
- Use *italic* for emphasis and nuanced descriptions
- Use \`inline code\` for technical terms or specific references  
- Use [links](url) for cross-references (use # as url)
- Use > blockquotes for notable quotes or definitions
- Use ==highlights== for critical insights

BENTO LAYOUT (NEW):
- Use <flex> containers for side-by-side layouts
- Use <card> for individual content sections
- Use <card flex> for flexible/responsive cards

Write 150 words total with heavy use of formatting and bento layouts.`,

  modifyPrompt: `You are an expert content editor. The user wants to modify existing content about "{currentTopic}".

CURRENT CONTENT:
"""
{currentContent}
"""

USER'S MODIFICATION REQUEST: "{prompt}"

TASK: Please modify the existing content according to the user's request. Follow these guidelines:

1. **PRESERVE STRUCTURE**: Keep the same general structure and organization unless the user specifically asks to change it
2. **INCREMENTAL CHANGES**: Make targeted modifications rather than complete rewrites
3. **MAINTAIN STYLE**: Keep the same writing style and tone
4. **ENHANCE, DON'T REPLACE**: Build upon existing content rather than starting from scratch
5. **KEEP MARKDOWN**: Maintain rich markdown formatting

OUTPUT: Provide the modified content maintaining the same approximate length and structure as the original.

IMPORTANT: Do NOT wrap your response in markdown code blocks. Provide the content directly without any code fence markers.`,

  asciiPrompt: `Create simple ASCII art for "{topic}". 

Requirements:
- Use these characters: │─┌┐└┘├┤┬┴┼►◄▲▼○●◐◑░▒▓█▀▄■□▪▫★☆♦♠♣♥⟨⟩/\\_|
- Shape should mirror the concept's essence
- Return ONLY the ASCII art characters
- Do NOT use markdown code blocks
- Do NOT add explanations or extra text
- Use \\n for line breaks`
};

const STORAGE_KEY = 'infinite-wiki-prompts';

export const usePromptSettings = () => {
  const [prompts, setPrompts] = useState<PromptSettings>(DEFAULT_PROMPTS);

  // Load from localStorage on initialization
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const savedPrompts = JSON.parse(stored);
        setPrompts({ ...DEFAULT_PROMPTS, ...savedPrompts });
      }
    } catch (error) {
      console.warn('Failed to load prompt settings:', error);
    }
  }, []);

  const updatePrompts = (newPrompts: Partial<PromptSettings>) => {
    const updated = { ...prompts, ...newPrompts };
    setPrompts(updated);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save prompt settings:', error);
    }
  };

  const resetToDefault = () => {
    setPrompts(DEFAULT_PROMPTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset prompt settings:', error);
    }
  };

  const getContentPrompt = (topic: string, previousTopic?: string | null) => {
    return prompts.contentPrompt.replace('{topic}', topic);
  };

  const getModifyPrompt = (currentTopic: string, currentContent: string, userPrompt: string) => {
    return prompts.modifyPrompt
      .replace('{currentTopic}', currentTopic)
      .replace('{currentContent}', currentContent)
      .replace('{prompt}', userPrompt);
  };

  const getAsciiPrompt = (topic: string) => {
    return prompts.asciiPrompt.replace('{topic}', topic);
  };

  return {
    prompts,
    updatePrompts,
    resetToDefault,
    getContentPrompt,
    getModifyPrompt,
    getAsciiPrompt
  };
};
