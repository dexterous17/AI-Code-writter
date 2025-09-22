/*
 * CodeDiffModal shows a GitHub-style diff between the previous and generated
 * code versions, keeping scroll positions in sync for easier inspection.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatSnippetPreview } from '../../../shared/lib/snippetPreview.js';

function computeDiffRows(previous = '', next = '') {
  const prevLines = previous.split(/\r?\n/);
  const nextLines = next.split(/\r?\n/);
  const m = prevLines.length;
  const n = nextLines.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (prevLines[i] === nextLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const rows = [];
  let i = 0;
  let j = 0;
  while (i < m || j < n) {
    const prevLine = prevLines[i];
    const nextLine = nextLines[j];
    if (i < m && j < n && prevLine === nextLine) {
      rows.push({ type: 'equal', left: prevLine, right: nextLine });
      i += 1;
      j += 1;
    } else if (j < n && (i === m || dp[i][j + 1] >= dp[i + 1][j])) {
      rows.push({ type: 'add', left: '', right: nextLine });
      j += 1;
    } else {
      rows.push({ type: 'remove', left: prevLine, right: '' });
      i += 1;
    }
  }

  return rows;
}

function buildColumn(rows, side) {
  let lineNumber = 0;
  return rows.map((row, idx) => {
    const text = side === 'left' ? row.left : row.right;
    const hasText = Boolean(text);
    if (hasText) lineNumber += 1;

    let variant = 'equal';
    if (row.type === 'add') {
      variant = side === 'right' ? 'add' : 'empty';
    } else if (row.type === 'remove') {
      variant = side === 'left' ? 'remove' : 'empty';
    }

    return {
      key: `${side}-${idx}`,
      text: hasText ? text : '',
      lineNumber: hasText ? lineNumber : '',
      variant,
    };
  });
}

export default function CodeDiffModal({ entry, onClose }) {
  const backdropRef = useRef(null);
  const leftColumnRef = useRef(null);
  const rightColumnRef = useRef(null);

  useEffect(() => {
    if (!entry) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [entry, onClose]);

  useEffect(() => {
    if (!entry) return undefined;
    const left = leftColumnRef.current;
    const right = rightColumnRef.current;
    if (!left || !right) return undefined;

    let syncing = false;

    const syncScroll = (from, to) => {
      if (!from || !to) return;
      if (syncing) return;
      syncing = true;
      to.scrollTop = from.scrollTop;
      to.scrollLeft = from.scrollLeft;
      requestAnimationFrame(() => {
        syncing = false;
      });
    };

    const onLeftScroll = () => syncScroll(left, right);
    const onRightScroll = () => syncScroll(right, left);

    left.addEventListener('scroll', onLeftScroll);
    right.addEventListener('scroll', onRightScroll);
    return () => {
      left.removeEventListener('scroll', onLeftScroll);
      right.removeEventListener('scroll', onRightScroll);
    };
  }, [entry]);

  const previousCode = entry?.previousCode ?? '';
  const responseCode = entry?.responseCode ?? '';
  const summary = entry?.summary || {};
  const prompt = entry?.prompt ?? '';
  const promptMessage = entry?.promptMessage?.trim();
  const promptSnippets = Array.isArray(entry?.promptSnippets)
    ? entry.promptSnippets.filter((snippet) => (snippet?.text || '').trim())
    : [];
  const hasPromptContent = Boolean(promptMessage) || promptSnippets.length > 0;
  const snippetPreviews = promptSnippets.map((snippet, index) => ({
    id: snippet.id ?? index,
    text: snippet.text,
    preview: formatSnippetPreview(snippet.text, { headLines: 3, tailLines: 2 }),
    order: index + 1,
  }));
  const [showSnippets, setShowSnippets] = useState(true);
  const headerSummary = '';
  const isOpen = Boolean(entry);

  const rows = useMemo(
    () => computeDiffRows(previousCode, responseCode),
    [previousCode, responseCode]
  );

  const leftColumn = useMemo(() => buildColumn(rows, 'left'), [rows]);
  const rightColumn = useMemo(() => buildColumn(rows, 'right'), [rows]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop diff-modal-backdrop"
      ref={backdropRef}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="diff-modal" role="dialog" aria-modal="true" aria-labelledby="diff-modal-title">
        <div className="diff-modal-header">
          <div>
            <h3 id="diff-modal-title">Code changes</h3>
          </div>
          <button className="btn" type="button" onClick={onClose}>Close</button>
        </div>
        <div className="diff-modal-body">
          {hasPromptContent && (
            <div className="diff-request">
              <div className="diff-request-header">
                <div className="diff-request-label">Request</div>
                {snippetPreviews.length > 0 && (
                  <div className="diff-request-controls">
                    <span className="diff-request-pill">{snippetPreviews.length} snippet{snippetPreviews.length > 1 ? 's' : ''}</span>
                    <button
                      type="button"
                      className="diff-request-toggle"
                      onClick={() => setShowSnippets((prev) => !prev)}
                    >
                      {showSnippets ? 'Hide' : 'Show'} snippets
                    </button>
                  </div>
                )}
              </div>
              <div className="diff-request-body">
                {promptMessage && (
                  <p className="diff-request-message">{promptMessage}</p>
                )}
                {snippetPreviews.length > 0 && showSnippets && (
                  <div className="diff-request-snippets">
                    {snippetPreviews.map((snippet) => (
                      <div key={snippet.id} className="diff-request-snippet-card">
                        <div className="diff-request-snippet-meta">Snippet {snippet.order}</div>
                        <pre className="diff-request-snippet">
                          {snippet.preview}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="diff-summary">
            <span>Lines: {summary.prevLineCount ?? 0} → {summary.nextLineCount ?? 0} ({summary.lineDelta >= 0 ? '+' : ''}{summary.lineDelta ?? 0})</span>
            <span>Chars: {summary.prevChars ?? 0} → {summary.nextChars ?? 0} ({summary.charDelta >= 0 ? '+' : ''}{summary.charDelta ?? 0})</span>
            <span>Approx. changed lines: {summary.changedLines ?? 0}</span>
          </div>
          <div className="diff-columns">
            <div className="diff-column">
              <div className="diff-column-header">Previous</div>
              <div className="diff-lines" ref={leftColumnRef}>
                {leftColumn.map((line) => (
                  <div key={line.key} className={`diff-line ${line.variant}`}>
                    <span className="diff-line-number">{line.lineNumber}</span>
                    <pre className="diff-line-code">{line.text || '\u00a0'}</pre>
                  </div>
                ))}
              </div>
            </div>
            <div className="diff-column">
              <div className="diff-column-header">Generated</div>
              <div className="diff-lines" ref={rightColumnRef}>
                {rightColumn.map((line) => (
                  <div key={line.key} className={`diff-line ${line.variant}`}>
                    <span className="diff-line-number">{line.lineNumber}</span>
                    <pre className="diff-line-code">{line.text || '\u00a0'}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
