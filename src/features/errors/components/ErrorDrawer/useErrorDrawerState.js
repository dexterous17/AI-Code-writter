import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LiveContext } from 'react-live';

const STORAGE_KEY = 'errorDrawerOpen';

export default function useErrorDrawerState({ markers = [], runtimeError: runtimeErrorProp } = {}) {
  const runtimeError = useRuntimeError(runtimeErrorProp);
  const [open, setOpen] = usePersistentFlag(STORAGE_KEY, false);
  const [dismissed, setDismissed] = useDismissableRuntimeError(runtimeError);
  const markerErrors = useMarkerErrors(markers);

  const runtimeCount = runtimeError && !dismissed ? 1 : 0;
  const totalCount = runtimeCount + markerErrors.length;
  const combinedText = useCombinedErrorText(runtimeError, dismissed, markerErrors);

  return {
    open,
    setOpen,
    runtimeError,
    dismissed,
    setDismissed,
    totalCount,
    combinedText,
  };
}

function useRuntimeError(runtimeErrorProp) {
  const live = useContext(LiveContext);
  return runtimeErrorProp ?? live?.error ?? null;
}

function usePersistentFlag(storageKey, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? stored === '1' : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, value ? '1' : '0');
    } catch {
      /* ignore storage failures */
    }
  }, [storageKey, value]);

  return [value, setValue];
}

function useDismissableRuntimeError(runtimeError) {
  const [dismissed, setDismissed] = useState(false);
  const lastErrorRef = useRef(null);

  useEffect(() => {
    if (runtimeError && runtimeError !== lastErrorRef.current) {
      lastErrorRef.current = runtimeError;
      setDismissed(false);
    }
  }, [runtimeError]);

  return [dismissed, setDismissed];
}

function useMarkerErrors(markers) {
  return useMemo(
    () => (markers || []).filter((marker) => (marker.severity || 0) >= 8),
    [markers],
  );
}

function useCombinedErrorText(runtimeError, dismissed, markerErrors) {
  return useMemo(() => {
    const parts = [];
    if (runtimeError && !dismissed) parts.push(String(runtimeError));
    if (markerErrors.length) {
      parts.push(
        markerErrors
          .map((marker) => `Line ${marker.startLineNumber}:${marker.startColumn} - ${marker.message}`)
          .join('\n'),
      );
    }
    return parts.join('\n\n');
  }, [runtimeError, dismissed, markerErrors]);
}
