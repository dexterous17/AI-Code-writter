import React from 'react';

export default function ErrorDrawerBody({
  open,
  totalCount,
  runtimeError,
  dismissed,
  onDismiss,
  onCopy,
  combinedText,
}) {
  if (!open) {
    return <div className="error-drawer-body" />;
  }

  return (
    <div className="error-drawer-body">
      {totalCount === 0 ? (
        <div className="error-empty">No errors</div>
      ) : (
        <div className="error-body-inner">
          <ErrorDrawerActions
            runtimeError={runtimeError}
            dismissed={dismissed}
            onDismiss={onDismiss}
            onCopy={onCopy}
          />
          <ErrorTerminal text={combinedText} />
        </div>
      )}
    </div>
  );
}

function ErrorDrawerActions({ runtimeError, dismissed, onDismiss, onCopy }) {
  return (
    <div className="error-actions">
      <button className="btn" onClick={onDismiss} disabled={!runtimeError || dismissed}>
        Clear
      </button>
      <button className="btn" onClick={onCopy}>
        Copy
      </button>
    </div>
  );
}

function ErrorTerminal({ text }) {
  return <pre className="error-terminal">{text}</pre>;
}
