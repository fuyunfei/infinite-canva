/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Check for OpenRouter API key
if (!process.env.OPENROUTER_API_KEY) {
  console.error(
    'OPENROUTER_API_KEY environment variable is not set. The application will not be able to connect to the OpenRouter API.',
  );
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const artModelName = 'google/gemini-2.5-flash-lite-preview-06-17';
const textModelName = 'google/gemini-2.5-flash-lite-preview-06-17';

/**
 * Art-direction toggle for ASCII art generation.
 * `true`: Slower, higher-quality results (allows the model to "think").
 * `false`: Faster, potentially lower-quality results (skips thinking).
 */
const ENABLE_THINKING_FOR_ASCII_ART = false;

/**
 * Art-direction toggle for blocky ASCII text generation.
 * `true`: Generates both creative art and blocky text for the topic name.
 * `false`: Generates only the creative ASCII art.
 */
const ENABLE_ASCII_TEXT_GENERATION = false;

export interface AsciiArtData {
  art: string;
  text?: string; // Text is now optional
}
export interface CardData {
  title: string;
  content: string;
}

export type CardStreamChunk = 
  | { type: 'title'; value: string }
  | { type: 'content'; value: string }
  | { type: 'separator' };

/**
 * Makes a streaming request to OpenRouter API
 */
async function* makeOpenRouterStreamRequest(prompt: string, model: string = textModelName) {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Infinite Wiki'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body reader available');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch (e) {
          console.warn('Failed to parse SSE chunk:', e);
        }
      }
    }
  }
}

/**
 * Makes a non-streaming request to OpenRouter API
 */
async function makeOpenRouterRequest(prompt: string, model: string = textModelName): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Infinite Wiki'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Generates associative content from the OpenRouter API as a real-time stream of card data.
 * @param topic The word or term to define.
 * @param previousTopic The previous topic the user was viewing, if any.
 * @param onChunk A callback function that receives parsed chunks of the stream.
 */
export async function generateContentCardsStream(
  topic: string,
  previousTopic: string | null | undefined,
  onChunk: (chunk: CardStreamChunk) => void,
  customPrompt?: string,
  currentPageContext?: string
): Promise<void> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured. Please check your environment variables to continue.');
  }

  // Use custom prompt if provided, otherwise choose based on whether it's a continuation or a new topic
  const contextInfo = currentPageContext ? `

CURRENT PAGE CONTEXT:
"""
${currentPageContext}
"""

The user was reading the above content and clicked on "${topic}". Use this context to provide more relevant and connected content.` : '';

  const prompt = customPrompt || (previousTopic
    ? `You are an entry in a surreal, infinite wikipedia in chinese. The user was just reading about "${previousTopic}" and clicked on the word "${topic}".${contextInfo} Provide distinct perspective exploring the connection, relationship, or tangential thoughts between these two concepts. 

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

Write 200 words total with heavy use of formatting and bento layouts. 
reply only in chinese.
`
    : `You are a surreal, infinite wikipedia . For the term "${topic}", provide few distinct sections that give a concise, wikipedia-style definition from different perspectives.${contextInfo}

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

Write 150 words total with heavy use of formatting and bento layouts.
reply only in chinese.
`);
  
  try {
    let contentBuffer = '';
    let isFirstChunk = true;

    for await (const chunk of makeOpenRouterStreamRequest(prompt, textModelName)) {

      
      // Initialize card on first content
      if (isFirstChunk) {
        onChunk({ type: 'title', value: '' });
        isFirstChunk = false;
      }
      
      // Send the raw chunk directly for true streaming
      // This preserves the natural streaming from the API
      onChunk({ type: 'content', value: chunk });
    }


  } catch (error) {
    console.error('Error generating streaming content from OpenRouter:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Could not generate content for "${topic}". ${errorMessage}`);
  }
}

/**
 * Generates a single random word or concept using the OpenRouter API.
 * @returns A promise that resolves to a single random word.
 */
export async function getRandomWord(): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  const prompt = `Generate a single, random, interesting word or a two-word concept. It can be a noun, verb, adjective, or a proper noun. Respond with only the word or concept itself, with no extra text, punctuation, or formatting.`;

  try {
    const response = await makeOpenRouterRequest(prompt, textModelName);
    return response.trim();
  } catch (error) {
    console.error('Error getting random word from OpenRouter:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Could not get random word: ${errorMessage}`);
  }
}

/**
 * Generates ASCII art with real streaming
 * @param topic The topic to generate art for.
 * @param onChunk Callback for streaming chunks
 */
export async function generateAsciiArtStream(
  topic: string, 
  onChunk: (chunk: string) => void,
  customPrompt?: string
): Promise<void> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }
  
  const prompt = customPrompt || `Create simple ASCII art for "${topic}". 

Requirements:
- Use these characters: │─┌┐└┘├┤┬┴┼►◄▲▼○●◐◑░▒▓█▀▄■□▪▫★☆♦♠♣♥⟨⟩/\\_|
- Shape should mirror the concept's essence
- Return ONLY the ASCII art characters
- Do NOT use markdown code blocks
- Do NOT add explanations or extra text
- Use \\n for line breaks

Examples:
- "explosion" → radiating lines from center
- "hierarchy" → pyramid structure  
- "flow" → curved directional lines`;
  
  try {
    for await (const chunk of makeOpenRouterStreamRequest(prompt, artModelName)) {
      // Filter out markdown code block markers from ASCII art
      let cleanChunk = chunk;
      
      // Remove code block fences and language specifiers
      cleanChunk = cleanChunk.replace(/```[\w]*\s*/g, '');
      cleanChunk = cleanChunk.replace(/```\s*/g, '');
      
      // Only send the chunk if it has content after cleaning
      if (cleanChunk) {
        onChunk(cleanChunk);
      }
    }
  } catch (error) {
    console.error('Error generating streaming ASCII art:', error);
    throw error;
  }
}

/**
 * Generates ASCII art using streaming for better UX
 * @param topic The topic to generate art for.
 * @param onChunk Callback for streaming chunks
 * @returns A promise that resolves when streaming is complete
 */
export async function generateAsciiArt(
  topic: string, 
  onChunk: (chunk: string) => void,
  customPrompt?: string
): Promise<void> {
  return generateAsciiArtStream(topic, onChunk, customPrompt);
}

/**
 * Generates modified content based on a custom prompt
 */
export async function generateModifiedContentStream(
  customPrompt: string,
  onChunk: (chunk: CardStreamChunk) => void
): Promise<void> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured. Please check your environment variables to continue.');
  }

  try {
    let isFirstChunk = true;

    for await (const chunk of makeOpenRouterStreamRequest(customPrompt, textModelName)) {
      // Initialize card on first content
      if (isFirstChunk) {
        onChunk({ type: 'title', value: '' });
        isFirstChunk = false;
      }
      
      // Filter out markdown code block markers in real-time
      let cleanChunk = chunk;
      
      // Remove code block fences
      cleanChunk = cleanChunk.replace(/```[\w]*\s*/g, '');
      cleanChunk = cleanChunk.replace(/```\s*/g, '');
      
      // Only send the chunk if it has content after cleaning
      if (cleanChunk) {
        onChunk({ type: 'content', value: cleanChunk });
      }
    }

  } catch (error) {
    console.error('Error generating modified content from OpenRouter:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Could not generate modified content. ${errorMessage}`);
  }
}

/**
 * Extracts all clickable words from markdown content
 */
export function extractClickableWords(content: string): string[] {
  const words = new Set<string>();
  
  // Extract from bold text
  const boldMatches = content.match(/\*\*([^*]+?)\*\*|__([^_]+?)__/g);
  if (boldMatches) {
    boldMatches.forEach(match => {
      const word = match.replace(/\*\*|__/g, '').trim();
      if (word.length > 2) words.add(word);
    });
  }
  
  // Extract from italic text
  const italicMatches = content.match(/\*([^*\s][^*]*?)\*|_([^_\s][^_]*?)_/g);
  if (italicMatches) {
    italicMatches.forEach(match => {
      const word = match.replace(/\*|_/g, '').trim();
      if (word.length > 2) words.add(word);
    });
  }
  
  // Extract from inline code
  const codeMatches = content.match(/`([^`]+?)`/g);
  if (codeMatches) {
    codeMatches.forEach(match => {
      const word = match.replace(/`/g, '').trim();
      if (word.length > 2) words.add(word);
    });
  }
  
  // Extract from highlights
  const highlightMatches = content.match(/==([^=]+?)==/g);
  if (highlightMatches) {
    highlightMatches.forEach(match => {
      const word = match.replace(/==/g, '').trim();
      if (word.length > 2) words.add(word);
    });
  }
  
  // Extract from links
  const linkMatches = content.match(/\[([^\]]+?)\]/g);
  if (linkMatches) {
    linkMatches.forEach(match => {
      const word = match.replace(/\[|\]/g, '').trim();
      if (word.length > 2) words.add(word);
    });
  }
  
  return Array.from(words);
}

/**
 * Generates related questions for multiple words in a single batch call
 */
export async function generateBatchRelatedQuestions(words: string[]): Promise<Record<string, string[]>> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  if (words.length === 0) return {};

  const prompt = `Generate related questions for multiple concepts. For each concept, provide 3 short, thought-provoking questions (5-10 words each).

CONCEPTS: ${words.map(w => `"${w}"`).join(', ')}

FORMAT: Return as JSON object where each key is the concept and value is array of 3 questions.

REQUIREMENTS:
- Each question should be 5-10 words maximum
- Focus on different aspects: origin, connection, implication
- Make questions that would lead to interesting exploration
- Return valid JSON only

EXAMPLE:
{
  "gravity": [
    "What created gravity's fundamental force?",
    "How does gravity shape social structures?", 
    "Why do ideas have gravitational pull?"
  ],
  "time": [
    "How do cultures perceive time differently?",
    "What makes time feel elastic?",
    "Why does time accelerate with age?"
  ]
}`;

  try {
    const response = await makeOpenRouterRequest(prompt, textModelName);
    let jsonStr = response.trim();
    
    // Remove any markdown code fences if present
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }

    const questionsData = JSON.parse(jsonStr);
    
    // Validate and clean the response
    const result: Record<string, string[]> = {};
    for (const word of words) {
      if (questionsData[word] && Array.isArray(questionsData[word])) {
        result[word] = questionsData[word].slice(0, 3); // Ensure max 3 questions
      } else {
        result[word] = []; // Fallback to empty array
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error generating batch related questions:', error);
    // Return empty questions for all words on error
    const result: Record<string, string[]> = {};
    words.forEach(word => result[word] = []);
    return result;
  }
}

/**
 * Generates related questions for a given word/concept
 */
export async function generateRelatedQuestions(word: string): Promise<string[]> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  const prompt = `Generate 3 short, thought-provoking questions related to "${word}". 

Requirements:
- Each question should be 5-10 words maximum
- Focus on different aspects: origin, connection, implication
- Make questions that would lead to interesting exploration
- Return only the questions, one per line
- No numbering, no extra text

Examples for "gravity":
What created gravity's fundamental force?
How does gravity shape social structures?
Why do ideas have gravitational pull?`;

  try {
    const response = await makeOpenRouterRequest(prompt, textModelName);
    const questions = response
      .trim()
      .split('\n')
      .filter(q => q.trim().length > 0)
      .slice(0, 3); // Ensure max 3 questions
    
    return questions;
  } catch (error) {
    console.error('Error generating related questions:', error);
    return []; // Return empty array on error
  }
}