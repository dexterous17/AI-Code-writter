import React from 'react';
import clsx from 'clsx';

function formatTimestamp(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    return '';
  }
}

export default function VersionTimeline({ versions, currentVersionId, onRestore, sortOrder = 'desc', onChangeSort }) {
  if (!versions || versions.length === 0) return null;

  const sorted = sortOrder === 'asc' ? [...versions] : [...versions].reverse();

  return (
    <div className="version-timeline">
      <div className="version-timeline-controls">
        <button
          type="button"
          className={clsx('version-sort-button', sortOrder === 'desc' && 'active')}
          onClick={() => onChangeSort?.('desc')}
        >
          Newest first
        </button>
        <button
          type="button"
          className={clsx('version-sort-button', sortOrder === 'asc' && 'active')}
          onClick={() => onChangeSort?.('asc')}
        >
          Oldest first
        </button>
      </div>
      <ul className="version-timeline-list">
        {sorted.map((version) => (
          <li
            key={version.id}
            className={clsx('version-item', version.id === currentVersionId && 'active')}
          >
            <div className="version-item-body">
              <div className="version-item-title">{version.label || 'Snapshot'}</div>
              <div className="version-item-meta">{formatTimestamp(version.timestamp)}</div>
              {version.summary && (
                <div className="version-item-summary">{version.summary}</div>
              )}
            </div>
            <button
              type="button"
              className="version-item-restore"
              onClick={() => onRestore(version.id)}
            >
              Restore
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
