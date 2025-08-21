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
- Example structure:
  <flex>
  <card>Regular card content</card>
  <card flex>Flexible card that adapts</card>
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
  const [activeTab, setActiveTab] = useState<'content' | 'modify' | 'ascii'>('content');

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
    onClose();
  };

  const resetToDefault = () => {
    onResetPrompts();
    setLocalPrompts(DEFAULT_PROMPTS);
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
          {(['content', 'modify', 'ascii'] as const).map((tab) => (
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
              {tab === 'content' ? 'Content' : tab === 'modify' ? 'Modify' : 'ASCII Art'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
