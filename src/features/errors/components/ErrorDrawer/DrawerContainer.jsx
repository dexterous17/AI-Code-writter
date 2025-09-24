import React from 'react';

export default function DrawerContainer({ open, hasError, children }) {
  const classes = ['error-drawer'];
  if (open) classes.push('open');
  if (hasError) classes.push('has-error');
  return <div className={classes.join(' ')}>{children}</div>;
}
