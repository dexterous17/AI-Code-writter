import React from 'react';

export default function ErrorDrawerToggleBar({ open, totalCount, onToggle }) {
  return (
    <div className="error-drawer-bar">
      <ErrorBadge totalCount={totalCount} />
      <DrawerToggle open={open} onToggle={onToggle} />
    </div>
  );
}

function ErrorBadge({ totalCount }) {
  const plural = totalCount === 1 ? '' : 's';
  const title = totalCount ? `${totalCount} error${plural}` : 'No errors';
  return (
    <div className="error-badge" title={title}>
      {totalCount}
    </div>
  );
}

function DrawerToggle({ open, onToggle }) {
  const label = open ? 'Hide errors' : 'Show errors';
  return (
    <button className="error-toggle" onClick={onToggle} aria-label={label}>
      {open ? '▼' : '▲'}
    </button>
  );
}
