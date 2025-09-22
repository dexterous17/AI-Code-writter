import React from 'react';

export default function ChatAttachmentList({
  entryId,
  attachments,
  collapsedAttachments,
  onToggle,
}) {
  if (!attachments.length) return null;
  const collapsed = collapsedAttachments[entryId] !== false;

  return (
    <div className="chat-attachment-group">
      <div className="chat-att-header">
        <span className="chat-att-label">
          {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          className="chat-att-toggle"
          onClick={() => onToggle(entryId)}
        >
          {collapsed ? 'Show' : 'Hide'} attachments
        </button>
      </div>
      {!collapsed && (
        <div className="chat-attachments">
          {attachments.map((att, idx) => (
            <figure key={idx} className="chat-attachment">
              <img src={att.dataUrl} alt={att.name || `Attachment ${idx + 1}`} className="chat-attachment-image" />
              {att.name && <figcaption>{att.name}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
