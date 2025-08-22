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

{context}

IMPORTANT: Use rich markdown formatting and new bento layout features:

MARKDOWN FORMATTING:
- Use **bold** for key terms and important concepts
- Use *italic* for emphasis and nuanced descriptions
- Use \`inline code\` for technical terms or specific references  
- Use [links](url) for cross-references (use # as url)
- Use > blockquotes for notable quotes or definitions
- Use ==highlights== for critical insights

BENTO LAYOUT SYSTEM:

TAGS DEFINITION:
- <flex> = Creates horizontal container for side-by-side content
- <card> = Creates bordered content box with fixed width
- <card flex> = Creates bordered content box that expands to fill space
- </flex> = Closes flex container
- </card> = Closes card container

RULES:
1. NEVER nest <card> inside <card> 
2. Only use <card> inside <flex> containers
3. Each <card> must have </card> closing tag
4. Each <flex> must have </flex> closing tag
5. Keep maximum 2-3 cards per flex container

WHEN TO USE:
- Use <flex> when you want to show related concepts side-by-side
- Use <card> for short, focused content
- Use <card flex> for longer content that needs more space

CORRECT EXAMPLES:
<flex>
<card>
## 理论
核心概念和定义
</card>
<card>
## 实践
具体应用和例子
</card>
</flex>

<flex>
<card>
## 要点
- 关键信息1
- 关键信息2
</card>
<card flex>
## 详细说明
长篇详细解释内容，需要更多空间...
</card>
</flex>

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

  const getContentPrompt = (topic: string, previousTopic?: string | null, context?: string) => {
    let prompt = prompts.contentPrompt.replace('{topic}', topic);
    if (context) {
      prompt = prompt.replace('{context}', context);
    }
    return prompt;
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
