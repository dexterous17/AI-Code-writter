/*
 * PromptBar contains the text input and action button used to ask the AI
 * for new component variations from anywhere inside the playground.
 */
import React, { useRef } from 'react';
import { GENERATION_PROMPT_PLACEHOLDER } from '../lib/generator.js';

export default function PromptBar({
  value,
  onChange,
  onAIGenerate,
  aiLoading,
  onAttachImage,
  pendingImage,
  onRemoveImage,
  snippets = [],
  onRemoveSnippet,
  inputRef,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    onAttachImage(file || null);
    event.target.value = '';
  };

  return (
    <div className="promptbar">
      {snippets.length > 0 && (
        <div className="prompt-snippets">
          {snippets.map((snippet) => (
            <div key={snippet.id} className="prompt-snippet">
              <pre className="prompt-snippet-text">{snippet.text}</pre>
              {onRemoveSnippet && (
                <button
                  type="button"
                  className="prompt-snippet-remove"
                  onClick={() => onRemoveSnippet(snippet.id)}
                  aria-label="Remove snippet"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="prompt-input-row">
        <textarea
          className="prompt-input prompt-textarea"
          placeholder={GENERATION_PROMPT_PLACEHOLDER}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          ref={(node) => {
            if (typeof inputRef === 'function') {
              inputRef(node);
            } else if (inputRef) {
              inputRef.current = node;
            }
          }}
          rows={snippets.length > 0 ? 3 : 2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onAIGenerate();
            }
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div className="prompt-actions">
          <button
            className="btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={aiLoading}
          >
            {pendingImage ? 'Replace image' : 'Attach image'}
          </button>
          {pendingImage && (
            <div className="prompt-attachment">
              <img src={pendingImage.dataUrl} alt={pendingImage.name} className="prompt-attachment-preview" />
              <button type="button" className="btn" onClick={onRemoveImage} disabled={aiLoading}>
                Remove
              </button>
            </div>
          )}
          <button className="btn primary" onClick={onAIGenerate} disabled={aiLoading}>
            {aiLoading ? 'AI Generating…' : 'AI Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
