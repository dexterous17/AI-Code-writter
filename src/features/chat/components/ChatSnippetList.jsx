import React from 'react';
import { formatSnippetPreview } from '../../../shared/lib/snippetPreview.js';

export default function ChatSnippetList({
  entryId,
  snippets,
  collapsedSnippets,
  onToggle,
  onSnippetHover,
}) {
  if (!snippets.length) return null;
  const collapsed = collapsedSnippets[entryId] !== false;

  return (
    <div className="chat-snippet-group">
      <div className="chat-snippet-header">
        <span className="chat-snippet-label">
          {snippets.length} snippet{snippets.length > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          className="chat-snippet-toggle"
          onClick={() => {
            if (!collapsed) onSnippetHover?.(null);
            onToggle(entryId);
          }}
        >
          {collapsed ? 'Show' : 'Hide'} snippets
        </button>
      </div>
      {!collapsed && (
        <div className="chat-snippet-list">
          {snippets.map((snippet) => (
            <pre
              key={snippet.id}
              className="chat-snippet"
              onMouseEnter={() => onSnippetHover?.(snippet)}
              onMouseLeave={() => onSnippetHover?.(null)}
            >
              {formatSnippetPreview(snippet.text)}
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}
