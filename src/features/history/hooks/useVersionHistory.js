import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'code_versions_v1';

function loadFromStorage() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to load version history', error);
    return [];
  }
}

function persistToStorage(versions) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
  } catch (error) {
    console.warn('Failed to persist version history', error);
  }
}

function buildSummary(summary) {
  if (!summary) return '';
  const lineDelta = summary.lineDelta >= 0 ? `+${summary.lineDelta}` : summary.lineDelta;
  const charDelta = summary.charDelta >= 0 ? `+${summary.charDelta}` : summary.charDelta;
  return `Lines ${summary.prevLineCount} → ${summary.nextLineCount} (${lineDelta}), chars ${summary.prevChars} → ${summary.nextChars} (${charDelta}).`;
}

export default function useVersionHistory() {
  const [versions, setVersions] = useState(() => loadFromStorage());
  const [currentVersionId, setCurrentVersionId] = useState(() => {
    const loaded = loadFromStorage();
    return loaded.length ? loaded[loaded.length - 1].id : null;
  });

  useEffect(() => {
    persistToStorage(versions);
  }, [versions]);

  const createVersion = useCallback((entryId, label, code, summaryText) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    entryId,
    label,
    code,
    summary: summaryText,
    timestamp: new Date().toISOString(),
  }), []);

  const addSnapshotsForEntry = useCallback(({ entryId, previousCode, nextCode, summary }) => {
    setVersions((prev) => {
      const updates = [];
      const summaryText = buildSummary(summary);
      const last = prev[prev.length - 1];

      if (previousCode && previousCode.trim()) {
        const sameAsLast = last && last.code === previousCode;
        if (!sameAsLast) {
          updates.push(createVersion(entryId, 'Before change', previousCode, `State before update. ${summaryText}`.trim()));
        }
      }

      if (nextCode && nextCode.trim()) {
        const latestCode = updates.length ? updates[updates.length - 1].code : (last ? last.code : null);
        if (latestCode !== nextCode) {
          updates.push(createVersion(entryId, 'After change', nextCode, `Resulting state. ${summaryText}`.trim()));
        }
      }

      if (!updates.length) return prev;
      const next = [...prev, ...updates];
      const latest = updates[updates.length - 1];
      setCurrentVersionId(latest.id);
      return next;
    });
  }, [createVersion]);

  const captureManualSnapshot = useCallback(({ label = 'Manual snapshot', code, summary }) => {
    if (!code || !code.trim()) return;
    const version = createVersion(null, label, code, summary || 'Manual capture.');
    setVersions((prev) => [...prev, version]);
    setCurrentVersionId(version.id);
  }, [createVersion]);

  const restoreVersion = useCallback((versionId) => {
    const target = versions.find((version) => version.id === versionId);
    if (!target) return null;
    setCurrentVersionId(versionId);
    return target;
  }, [versions]);

  const getRecentSummaries = useCallback((count = 3) => {
    if (!versions.length) return [];
    return versions.slice(-count);
  }, [versions]);

  const clearHistory = useCallback(() => {
    setVersions([]);
    setCurrentVersionId(null);
  }, []);

  const orderedVersions = useMemo(() => versions, [versions]);

  return {
    versions: orderedVersions,
    currentVersionId,
    addSnapshotsForEntry,
    captureManualSnapshot,
    restoreVersion,
    getRecentSummaries,
    clearHistory,
  };
}
