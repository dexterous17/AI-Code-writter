/*
 * ErrorDrawer orchestrates persistence, runtime error state, and presentation by
 * delegating to focused hooks and presentational subcomponents.
 */
import React, { useCallback } from 'react';
import useErrorDrawerState from './ErrorDrawer/useErrorDrawerState.js';
import DrawerContainer from './ErrorDrawer/DrawerContainer.jsx';
import ErrorDrawerToggleBar from './ErrorDrawer/ErrorDrawerToggleBar.jsx';
import ErrorDrawerBody from './ErrorDrawer/ErrorDrawerBody.jsx';

export default function ErrorDrawer(props) {
  const {
    open,
    setOpen,
    runtimeError,
    dismissed,
    setDismissed,
    totalCount,
    combinedText,
  } = useErrorDrawerState(props);

  const handleToggle = useCallback(() => {
    setOpen((value) => !value);
  }, [setOpen]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, [setDismissed]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(combinedText || 'No errors');
    } catch {
      /* clipboard write can fail silently */
    }
  }, [combinedText]);

  return (
    <DrawerContainer open={open} hasError={Boolean(totalCount)}>
      <ErrorDrawerToggleBar
        open={open}
        totalCount={totalCount}
        onToggle={handleToggle}
      />
      <ErrorDrawerBody
        open={open}
        totalCount={totalCount}
        runtimeError={runtimeError}
        dismissed={dismissed}
        onDismiss={handleDismiss}
        onCopy={handleCopy}
        combinedText={combinedText}
      />
    </DrawerContainer>
  );
}
