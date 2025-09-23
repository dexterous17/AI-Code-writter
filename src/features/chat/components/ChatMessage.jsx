import React from 'react';
import ChatSnippetList from './ChatSnippetList.jsx';
import ChatAttachmentList from './ChatAttachmentList.jsx';

export default function ChatMessage({
  entry,
  time,
  snippetsCollapsed,
  attachmentsCollapsed,
  onToggleSnippets,
  onToggleAttachments,
  onSnippetHover,
  onOpenDiff,
}) {
  if (entry.status === 'notice') {
    return (
      <div className="chat-entry">
        <div className="chat-message notice">
          <div className="chat-message-heading">
            <span className="chat-author">System</span>
            {time && <span className="chat-timestamp">{time}</span>}
          </div>
          <p className="chat-text">{entry.notice}</p>
        </div>
      </div>
    );
  }

  const entrySnippets = entry.promptSnippets || [];
  const entryAttachments = entry.attachments || [];
  const message = entry.promptMessage ?? (entrySnippets.length ? '' : entry.prompt);

  return (
    <div className="chat-entry">
      <div className="chat-message user">
        <div className="chat-message-heading">
          <span className="chat-author">You</span>
          {time && <span className="chat-timestamp">{time}</span>}
        </div>
        <ChatSnippetList
          entryId={entry.id}
          snippets={entrySnippets}
          collapsedSnippets={snippetsCollapsed}
          onToggle={onToggleSnippets}
          onSnippetHover={onSnippetHover}
        />
        {message && <p className="chat-text">{message}</p>}
        <ChatAttachmentList
          entryId={entry.id}
          attachments={entryAttachments}
          collapsedAttachments={attachmentsCollapsed}
          onToggle={onToggleAttachments}
        />
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
}
