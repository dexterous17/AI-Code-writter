import { useEffect, useRef } from 'react';

export default function useHighlightDecorations(editor, highlightRange) {
  const decorationsRef = useRef([]);

  useEffect(() => {
    if (!editor || !editor.hasModel()) return undefined;

    const range = normalizeRange(highlightRange);
    const decorations = range
      ? [
        {
          range,
          options: { inlineClassName: 'editor-hover-highlight' },
        },
      ]
      : [];

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);

    if (range) {
      try {
        editor.revealRangeInCenter(range);
      } catch {
        // editor might be disposed during unmount
      }
    }

    return () => {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    };
  }, [editor, highlightRange]);
}

function normalizeRange(range) {
  if (!range) return null;

  const {
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
  } = range;

  if (
    typeof startLineNumber !== 'number'
    || typeof startColumn !== 'number'
    || typeof endLineNumber !== 'number'
    || typeof endColumn !== 'number'
  ) {
    return null;
  }

  return {
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
  };
}
