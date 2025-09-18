/*
 * ErrorDrawer lists runtime and type issues detected in the preview, letting
 * users inspect, copy, or dismiss them without interrupting the session.
 */
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LiveContext } from 'react-live';

// Reusable error drawer that can take runtimeError via props
// or read it from LiveContext if not provided.
export default function ErrorDrawer({ markers = [], runtimeError: runtimeErrorProp }) {
  const live = useContext(LiveContext);
  const runtimeError = runtimeErrorProp ?? live?.error ?? null;

  const [open, setOpen] = useState(() => {
    const v = localStorage.getItem('errorDrawerOpen');
    return v ? v === '1' : false;
  });
  useEffect(() => { localStorage.setItem('errorDrawerOpen', open ? '1' : '0'); }, [open]);

  // Dismiss runtime error locally without affecting evaluation result
  const [dismissed, setDismissed] = useState(false);
  const lastErrRef = useRef(null);
  useEffect(() => {
    if (runtimeError && runtimeError !== lastErrRef.current) {
      lastErrRef.current = runtimeError;
      setDismissed(false);
    }
  }, [runtimeError]);

  // Monaco marker severity: 8=Error, 4=Warning, 2=Info, 1=Hint
  const markerErrors = useMemo(() => (markers || []).filter(m => (m.severity || 0) >= 8), [markers]);
  const runtimeCount = runtimeError && !dismissed ? 1 : 0;
  const totalCount = runtimeCount + markerErrors.length;

  const combinedText = useMemo(() => {
    const parts = [];
    if (runtimeError && !dismissed) parts.push(String(runtimeError));
    if (markerErrors.length) {
      parts.push(markerErrors.map(m => `Line ${m.startLineNumber}:${m.startColumn} - ${m.message}`).join('\n'));
    }
    return parts.join('\n\n');
  }, [runtimeError, dismissed, markerErrors]);

  const copyAll = async () => {
    try { await navigator.clipboard.writeText(combinedText || 'No errors'); } catch {}
  };

  return (
    <div className={`error-drawer ${open ? 'open' : ''} ${totalCount ? 'has-error' : ''}`}>
      <div className="error-drawer-bar">
        <div className="error-badge" title={totalCount ? `${totalCount} error${totalCount>1?'s':''}` : 'No errors'}>{totalCount}</div>
        <div>
          <button className="error-toggle" onClick={() => setOpen(v => !v)} aria-label={open ? 'Hide errors' : 'Show errors'}>
            {open ? '▼' : '▲'}
          </button>
        </div>
      </div>
      <div className="error-drawer-body">
        {!open ? null : (
          totalCount === 0 ? (
            <div className="error-empty">No errors</div>
          ) : (
            <div className="error-body-inner">
              <div className="error-actions">
                <button className="btn" onClick={() => setDismissed(true)} disabled={!runtimeError || dismissed}>Clear</button>
                <button className="btn" onClick={copyAll}>Copy</button>
              </div>
              <pre className="error-terminal">{combinedText}</pre>
            </div>
          )
        )}
      </div>
    </div>
  );
}
