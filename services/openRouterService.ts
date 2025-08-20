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
  onChunk: (chunk: CardStreamChunk) => void
): Promise<void> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured. Please check your environment variables to continue.');
  }

  // Choose prompt based on whether it's a continuation or a new topic
  const prompt = previousTopic
    ? `You are an entry in a surreal, infinite encyclopedia. The user was just reading about "${previousTopic}" and clicked on the word "${topic}". Provide distinct prespective exploring the connection, relationship, or tangential thoughts between these two concepts. provide the content in markdown, you can use all markdown types, list / table / inlines etc. Separate each section with a line containing only divided line. 200 words in total  `
    : `You are a surreal, infinite encyclopedia. For the term "${topic}", provide few distinct sections that give a concise, encyclopedia-style definition from different perspectives.  provide the content in markdown , provide the content in markdown, you can use all markdown types, list table inlines etc. Separate each section with a divided line .  150 words in total `;
  
  try {
    let contentBuffer = '';
    let isFirstChunk = true;

    for await (const chunk of makeOpenRouterStreamRequest(prompt, textModelName)) {
      console.log('DEBUG SERVICE: Raw chunk received:', chunk); // DEBUG
      
      // Initialize card on first content
      if (isFirstChunk) {
        onChunk({ type: 'title', value: '' });
        isFirstChunk = false;
      }
      
      // Send the raw chunk directly for true streaming
      // This preserves the natural streaming from the API
      onChunk({ type: 'content', value: chunk });
    }

    console.log('DEBUG SERVICE: Streaming completed'); // DEBUG
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
 * Generates ASCII art and optionally text for a given topic.
 * @param topic The topic to generate art for.
 * @returns A promise that resolves to an object with art and optional text.
 */
export async function generateAsciiArt(topic: string): Promise<AsciiArtData> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }
  
  const artPromptPart = `1. "ASCII art": meta ASCII horizontal diagram visualization of the word "${topic}"`;


  const keysDescription = `one key: "ASCII art"`;
  const promptBody = artPromptPart;

  const prompt = `For "${topic}", create a JSON object with ${keysDescription}.
${promptBody}

Return ONLY the raw JSON object, no additional text. The response must start with "{" and end with "}" and contain only the ASCII art property.`;

  const maxRetries = 1;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await makeOpenRouterRequest(prompt, artModelName);
      let jsonStr = response.trim();
      
      // Debug logging
      console.log(`Attempt ${attempt}/${maxRetries} - Raw API response:`, jsonStr);
      
      // Remove any markdown code fences if present
      const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }

      // Ensure the string starts with { and ends with }
      if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
        throw new Error('Response is not a valid JSON object');
      }

      const parsedData = JSON.parse(jsonStr) as AsciiArtData;
      
      // Validate the response structure
      if (typeof parsedData.art !== 'string' || parsedData.art.trim().length === 0) {
        throw new Error('Invalid or empty ASCII art in response');
      }
      
      // If we get here, the validation passed
      const result: AsciiArtData = {
        art: parsedData.art,
      };

      if (ENABLE_ASCII_TEXT_GENERATION && parsedData.text) {
        result.text = parsedData.text;
      }
      
      return result;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        console.error('All retry attempts failed for ASCII art generation');
        throw new Error(`Could not generate ASCII art after ${maxRetries} attempts: ${lastError.message}`);
      }
      // Continue to next attempt
    }
  }

  // This should never be reached, but just in case
  throw lastError || new Error('All retry attempts failed');
}