import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LiveProvider, LivePreview } from 'react-live';
import ErrorDrawer from '../../errors/components/ErrorDrawer.jsx';

export default function PreviewModal({ open, onClose, code, markers, scope }) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const modal = (
    <div
      className="modal-backdrop preview-modal-backdrop"
      onMouseDown={handleBackdropClick}
    >
      <div className="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-modal-title">
        <header className="preview-modal-header">
          <h3 id="preview-modal-title">Live Preview</h3>
          <button type="button" className="btn" onClick={onClose}>Close</button>
        </header>
        <div className="preview-modal-body">
          <LiveProvider code={code} scope={scope} noInline>
            <div className="preview-modal-content">
              <div className="preview-surface preview-modal-surface">
                <LivePreview />
              </div>
              <ErrorDrawer markers={markers} />
            </div>
          </LiveProvider>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
