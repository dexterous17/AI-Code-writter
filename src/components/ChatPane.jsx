/*
 * ChatPane renders the AI assistant history, summary metadata, and prompt bar
 * inside the tabbed layout, delegating interactions back to the main App.
 */
import React from 'react';
import { formatSnippetPreview } from '../lib/snippetPreview.js';
import PromptBar from './PromptBar.jsx';

export default function ChatPane({
  chatHistory,
  prompt,
  onPromptChange,
  onGenerate,
  aiLoading,
  onOpenDiff,
  chatStreamRef,
  pendingImage,
  onAttachImage,
  onRemoveImage,
  promptSnippets,
  onRemoveSnippet,
  inputRef,
  onSnippetHover,
}) {
  const [collapsedSnippets, setCollapsedSnippets] = React.useState({});

  const toggleSnippetsForEntry = React.useCallback((entryId) => {
    setCollapsedSnippets((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  }, []);

  return (
    <div className="chat-pane">
      <div className="chat-pane-header">
        <div className="chat-pane-title">AI Assistant</div>
        <p className="chat-pane-description">
          Ask for component updates or new ideas. Generated code replaces the editor and updates the preview tab.
        </p>
      </div>
      <div className="chat-stream" ref={chatStreamRef}>
        {chatHistory.length === 0 ? (
          <div className="chat-empty">No conversations yet. Describe the component you want below to begin.</div>
        ) : (
          chatHistory.map((entry) => {
            const time = entry.timestamp
              ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';
            const entrySnippets = entry.promptSnippets || [];
            const message = entry.promptMessage ?? (entrySnippets.length ? '' : entry.prompt);
            const snippetsCollapsed = collapsedSnippets[entry.id] === true;
            return (
              <div key={entry.id} className="chat-entry">
                <div className="chat-message user">
                  <div className="chat-message-heading">
                    <span className="chat-author">You</span>
                    {time && <span className="chat-timestamp">{time}</span>}
                  </div>
                  {entrySnippets.length > 0 && (
                    <div className="chat-snippet-group">
                      <div className="chat-snippet-header">
                        <span className="chat-snippet-label">
                          {entrySnippets.length} snippet{entrySnippets.length > 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          className="chat-snippet-toggle"
                          onClick={() => {
                            if (!snippetsCollapsed) onSnippetHover?.(null);
                            toggleSnippetsForEntry(entry.id);
                          }}
                        >
                          {snippetsCollapsed ? 'Show' : 'Hide'} snippets
                        </button>
                      </div>
                      {!snippetsCollapsed && (
                        <div className="chat-snippet-list">
                          {entrySnippets.map((snippet) => (
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
                  )}
                  {message && <p className="chat-text">{message}</p>}
                  {!!entry.attachments?.length && (
                    <div className="chat-attachments">
                      {entry.attachments.map((att, idx) => (
                        <figure key={idx} className="chat-attachment">
                          <img src={att.dataUrl} alt={att.name || `Attachment ${idx + 1}`} className="chat-attachment-image" />
                          {att.name && <figcaption>{att.name}</figcaption>}
                        </figure>
                      ))}
                    </div>
                  )}
                </div>
                {entry.status === 'success' ? (
                  <div className="chat-message assistant">
                    <div className="chat-message-heading">
                      <span className="chat-author">AI</span>
                      {time && <span className="chat-timestamp">{time}</span>}
                    </div>
                    <div className="chat-summary-row">
                      <div className="chat-summary">
                        <p className="chat-summary-heading">Updated the editor with new code.</p>
                        <div className="chat-diff">
                          Lines: {entry.summary.prevLineCount}
                          {' '}
                          → {entry.summary.nextLineCount}
                          {' '}
                          ({entry.summary.lineDelta >= 0 ? '+' : ''}{entry.summary.lineDelta}).
                          {' '}
                          Chars: {entry.summary.prevChars}
                          {' '}
                          → {entry.summary.nextChars}
                          {' '}
                          ({entry.summary.charDelta >= 0 ? '+' : ''}{entry.summary.charDelta}).
                        </div>
                        <div className="chat-diff">
                          Approx. changed lines: {entry.summary.changedLines}.
                        </div>
                      </div>
                      <button type="button" className="chat-diff-button" onClick={() => onOpenDiff(entry)}>
                        View code changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="chat-message assistant error">
                    <div className="chat-message-heading">
                      <span className="chat-author">AI</span>
                      {time && <span className="chat-timestamp">{time}</span>}
                    </div>
                    <p className="chat-text">{entry.error}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <PromptBar
        value={prompt}
        onChange={onPromptChange}
        onAIGenerate={onGenerate}
        aiLoading={aiLoading}
        onAttachImage={onAttachImage}
        pendingImage={pendingImage}
        onRemoveImage={onRemoveImage}
        snippets={promptSnippets}
        onRemoveSnippet={onRemoveSnippet}
        inputRef={inputRef}
        onSnippetHover={onSnippetHover}
      />
    </div>
  );
}
