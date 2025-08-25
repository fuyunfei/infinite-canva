/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: PromptSettings;
  onUpdatePrompts: (prompts: Partial<PromptSettings>) => void;
  onResetPrompts: () => void;
}

interface PromptSettings {
  contentPrompt: string;
  modifyPrompt: string;
  asciiPrompt: string;
}

interface ApiKeySettings {
  openRouterApiKey: string;
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
5. **KEEP MARKDOWN**: Maintain rich markdown formatting:
   - Use **bold** for key terms and important concepts
   - Use *italic* for emphasis and nuanced descriptions
   - Use \`inline code\` for technical terms
   - Use [links](url) for cross-references (use # as url)
   - Use > blockquotes for quotes or definitions
   - Use ==highlights== for critical insights
   - Use lists and tables where appropriate

6. **SPECIFIC MODIFICATIONS**: Based on the user's request:
   - If they ask to "add examples" → add concrete examples while keeping existing content
   - If they ask to "make it simpler" → simplify language but keep all key points
   - If they ask to "make it more technical" → add technical details and terminology
   - If they ask to "expand" → add more depth and detail
   - If they ask to "focus on X" → emphasize X aspects while keeping context

OUTPUT: Provide the modified content maintaining the same approximate length and structure as the original.

IMPORTANT: Do NOT wrap your response in markdown code blocks. Provide the content directly without any code fence markers.`,

  asciiPrompt: `Create simple ASCII art for "{topic}". 

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
- "flow" → curved directional lines`
};

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, prompts, onUpdatePrompts, onResetPrompts }) => {
  const [localPrompts, setLocalPrompts] = useState<PromptSettings>(prompts);
  const [activeTab, setActiveTab] = useState<'content' | 'modify' | 'ascii' | 'apikey'>('content');
  const [apiKey, setApiKey] = useState<string>('');

  // Load API key from localStorage on mount
  useEffect(() => {
    try {
      const storedApiKey = localStorage.getItem('infinite-wiki-api-key');
      if (storedApiKey) {
        setApiKey(storedApiKey);
      }
    } catch (error) {
      console.warn('Failed to load API key from localStorage:', error);
    }
  }, []);

  // Update local state when props change
  useEffect(() => {
    setLocalPrompts(prompts);
  }, [prompts]);

  // Auto-resize textarea when content or tab changes
  useEffect(() => {
    const textarea = document.querySelector('.settings-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(200, textarea.scrollHeight) + 'px';
    }
  }, [activeTab, localPrompts]);

  // Save settings
  const saveSettings = () => {
    onUpdatePrompts(localPrompts);
    
    // Save API key to localStorage
    try {
      if (apiKey.trim()) {
        localStorage.setItem('infinite-wiki-api-key', apiKey.trim());
        // Update the environment variable for immediate use
        (process.env as any).OPENROUTER_API_KEY = apiKey.trim();
      } else {
        localStorage.removeItem('infinite-wiki-api-key');
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
    
    onClose();
  };

  const resetToDefault = () => {
    onResetPrompts();
    setLocalPrompts(DEFAULT_PROMPTS);
    setApiKey('');
    localStorage.removeItem('infinite-wiki-api-key');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '800px',
        maxHeight: '80vh',
        width: '90%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: '1rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.4em', fontWeight: '600' }}>Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5em',
              cursor: 'pointer',
              color: '#666',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #f0f0f0'
        }}>
          {(['content', 'modify', 'ascii', 'apikey'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="random-button"
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 0',
                font: 'inherit',
                color: activeTab === tab ? '#0000ff' : '#000000',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid #0000ff' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'content' ? 'Content' : 
               tab === 'modify' ? 'Modify' : 
               tab === 'ascii' ? 'ASCII Art' : 'API Key'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'apikey' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1em', fontWeight: '600' }}>
                  OpenRouter API Key
                </h3>
                <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9em', lineHeight: '1.5' }}>
                  Enter your OpenRouter API key to use the AI features. You can get one from{' '}
                  <a 
                    href="https://openrouter.ai/keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#0000ff', textDecoration: 'underline' }}
                  >
                    openrouter.ai/keys
                  </a>
                </p>
              </div>
              
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '1rem',
                  font: 'inherit',
                  fontSize: '0.9em',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                }}
                onFocus={(e) => e.target.style.borderColor = '#666'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
              
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <p style={{ margin: '0', fontSize: '0.85em', color: '#666', lineHeight: '1.4' }}>
                  <strong>Note:</strong> Your API key is stored locally in your browser and is not sent to any servers except OpenRouter for AI requests.
                </p>
              </div>
            </div>
          ) : (
            <textarea
              className="settings-textarea"
              value={
                activeTab === 'content' ? localPrompts.contentPrompt :
                activeTab === 'modify' ? localPrompts.modifyPrompt :
                localPrompts.asciiPrompt
              }
              onChange={(e) => {
                const newValue = e.target.value;
                setLocalPrompts(prev => ({
                  ...prev,
                  [activeTab === 'content' ? 'contentPrompt' : 
                   activeTab === 'modify' ? 'modifyPrompt' : 'asciiPrompt']: newValue
                }));
                
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.max(200, e.target.scrollHeight) + 'px';
              }}
              style={{
                minHeight: '200px',
                maxHeight: '60vh',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '1rem',
                font: 'inherit',
                fontSize: '0.9em',
                lineHeight: '1.5',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s',
                overflow: 'auto'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#666';
                // Set initial height based on content
                e.target.style.height = 'auto';
                e.target.style.height = Math.max(200, e.target.scrollHeight) + 'px';
              }}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              placeholder={`Enter ${activeTab} prompt...`}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e0e0e0'
        }}>
          <button
            onClick={resetToDefault}
            className="random-button"
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 0',
              font: 'inherit',
              color: '#666',
              cursor: 'pointer'
            }}
          >
            Reset to Default
          </button>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={onClose}
              className="random-button"
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 0',
                font: 'inherit',
                color: '#666',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              className="random-button"
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 0',
                font: 'inherit',
                color: '#0000ff',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
