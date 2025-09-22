/*
 * ChatPane renders the AI assistant history, summary metadata, and prompt bar
 * inside the tabbed layout, delegating interactions back to the main App.
 */
import React from 'react';
import PromptBar from './PromptBar.jsx';
import ChatMessage from './ChatMessage.jsx';

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
  const [collapsedAttachments, setCollapsedAttachments] = React.useState({});

  const toggleSnippetsForEntry = React.useCallback((entryId) => {
    setCollapsedSnippets((prev) => ({
      ...prev,
      [entryId]: prev[entryId] !== false ? false : true,
    }));
  }, []);

  const toggleAttachmentsForEntry = React.useCallback((entryId) => {
    setCollapsedAttachments((prev) => ({
      ...prev,
      [entryId]: prev[entryId] !== false ? false : true,
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
            return (
              <ChatMessage
                key={entry.id}
                entry={entry}
                time={time}
                snippetsCollapsed={collapsedSnippets}
                attachmentsCollapsed={collapsedAttachments}
                onToggleSnippets={toggleSnippetsForEntry}
                onToggleAttachments={toggleAttachmentsForEntry}
                onSnippetHover={onSnippetHover}
                onOpenDiff={onOpenDiff}
              />
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
