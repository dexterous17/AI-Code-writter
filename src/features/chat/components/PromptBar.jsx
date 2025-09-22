/*
 * PromptBar contains the text input and action button used to ask the AI
 * for new component variations from anywhere inside the playground.
 */
import React, { useRef } from 'react';
import { GENERATION_PROMPT_PLACEHOLDER } from '../lib/generator.js';
import IconButton from '../../../shared/components/IconButton.jsx';
import { formatSnippetPreview } from '../../../shared/lib/snippetPreview.js';

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
  onSnippetHover,
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
            <div
              key={snippet.id}
              className="prompt-snippet"
              onMouseEnter={() => onSnippetHover?.(snippet)}
              onMouseLeave={() => onSnippetHover?.(null)}
            >
              <pre className="prompt-snippet-text">
                {formatSnippetPreview(snippet.text, { headLines: 2, tailLines: 1 })}
              </pre>
              {onRemoveSnippet && (
                <button
                  type="button"
                  className="prompt-snippet-remove"
                  onClick={() => {
                    onSnippetHover?.(null);
                    onRemoveSnippet(snippet.id);
                  }}
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
          <IconButton
            label={pendingImage ? 'Replace image' : 'Attach image'}
            icon={pendingImage ? '↻' : '+'}
            onClick={() => fileInputRef.current?.click()}
            disabled={aiLoading}
            tooltip={pendingImage ? 'Replace image' : 'Attach image'}
            className={pendingImage ? 'icon-button-replace' : ''}
          />
          {pendingImage && (
            <div className="prompt-attachment">
              <img src={pendingImage.dataUrl} alt={pendingImage.name} className="prompt-attachment-preview" />
              <button type="button" className="btn" onClick={onRemoveImage} disabled={aiLoading}>
                Remove
              </button>
            </div>
          )}
          <IconButton
            label={aiLoading ? 'Generating code' : 'Generate code'}
            icon={aiLoading ? '…' : '➤'}
            onClick={onAIGenerate}
            disabled={aiLoading}
            tooltip={aiLoading ? 'Generating…' : 'Generate code'}
            className="icon-button-generate primary"
          />
        </div>
      </div>
    </div>
  );
}
