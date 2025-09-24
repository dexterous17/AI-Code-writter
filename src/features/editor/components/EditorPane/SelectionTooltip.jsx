import React from 'react';

export default function SelectionTooltip({ tooltip, onAdd, onDismiss }) {
  if (!tooltip) return null;

  const preventBlur = (event) => {
    event.preventDefault();
  };

  return (
    <div
      className="editor-selection-tooltip"
      style={{ top: tooltip.top, left: tooltip.left }}
    >
      <button
        type="button"
        className="editor-selection-action"
        onMouseDown={preventBlur}
        onClick={onAdd}
      >
        Add to chat
      </button>
      <button
        type="button"
        className="editor-selection-dismiss"
        onMouseDown={preventBlur}
        onClick={onDismiss}
        aria-label="Dismiss selection"
      >
        ×
      </button>
    </div>
  );
}
