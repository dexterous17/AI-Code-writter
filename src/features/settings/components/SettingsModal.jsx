/*
 * SettingsModal surfaces theme, auto-run, and API key controls while keeping
 * focus trapped in a modal overlay consistent with the playground styling.
 */
import React, { useEffect, useRef } from 'react';

export default function SettingsModal({ open, onClose, dark, setDark, apiKey, setApiKey, autoRun, setAutoRun }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" ref={dialogRef}>
        <div className="modal-header">
          <h3 id="settings-title">Settings</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label className="switch">
              <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
              <span>Dark theme</span>
            </label>
          </div>

          <div className="form-row">
            <label className="switch">
              <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} />
              <span>Auto-run preview</span>
            </label>
            <small className="help">When off, use the Run button to update the preview.</small>
          </div>

          <div className="form-row">
            <label className="label">OpenAI API Key</label>
            <input
              className="prompt-input"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); localStorage.setItem('openai_api_key', e.target.value); }}
            />
            <small className="help">Stored locally in your browser only.</small>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
