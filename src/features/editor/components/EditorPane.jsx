/*
 * EditorPane coordinates the Monaco editor with tooltip interactions, marker
 * propagation, and highlight decorations via focused hooks.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import useSelectionTooltip from './EditorPane/useSelectionTooltip.js';
import useHighlightDecorations from './EditorPane/useHighlightDecorations.js';
import SelectionTooltip from './EditorPane/SelectionTooltip.jsx';
import { getSelectionRange } from './EditorPane/selectionUtils.js';

export default function EditorPane({
  value,
  onChange,
  dark,
  onMarkersChange,
  onAddSelectionToChat,
  highlightRange,
}) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const [editorInstance, setEditorInstance] = useState(null);

  const { tooltip, hideTooltip, attachEditorListeners } = useSelectionTooltip({
    editorRef,
    containerRef,
  });

  useHighlightDecorations(editorInstance, highlightRange);

  const editorOptions = useMemo(() => ({
    fontSize: 14,
    minimap: { enabled: false },
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    tabSize: 2,
    automaticLayout: true,
  }), []);

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;
    setEditorInstance(editor);
    attachEditorListeners(editor);
  }, [attachEditorListeners]);

  const handleEditorChange = useCallback((val) => {
    onChange(val ?? '');
  }, [onChange]);

  const handleValidation = useCallback((markers) => {
    if (!onMarkersChange) return;
    try {
      onMarkersChange(markers || []);
    } catch {
      // ignore marker listeners throwing
    }
  }, [onMarkersChange]);

  const handleAddSelection = useCallback(() => {
    if (!onAddSelectionToChat || !tooltip) return;
    const range = getSelectionRange(editorInstance);
    onAddSelectionToChat({ text: tooltip.text, range });
    hideTooltip();
    editorInstance?.focus();
  }, [editorInstance, hideTooltip, onAddSelectionToChat, tooltip]);

  return (
    <div className="editor-root" ref={containerRef}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme={dark ? 'vs-dark' : 'light'}
        value={value}
        onMount={handleEditorMount}
        onChange={handleEditorChange}
        onValidate={handleValidation}
        options={editorOptions}
      />
      <SelectionTooltip
        tooltip={tooltip}
        onAdd={handleAddSelection}
        onDismiss={hideTooltip}
      />
    </div>
  );
}
