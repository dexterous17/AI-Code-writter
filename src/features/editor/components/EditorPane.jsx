/*
 * EditorPane wraps the Monaco editor configuration used for authoring code
 * while relaying value changes and lint markers back to the parent App.
 */
import React from 'react';
import Editor from '@monaco-editor/react';

const TOOLTIP_WIDTH = 140;
const KEYBOARD_SELECTION_DELAY = 200;

export default function EditorPane({ value, onChange, dark, onMarkersChange, onAddSelectionToChat, highlightRange }) {
  const containerRef = React.useRef(null);
  const editorRef = React.useRef(null);
  const disposablesRef = React.useRef([]);
  const [tooltip, setTooltip] = React.useState(null);
  const selectionTimerRef = React.useRef(null);
  const highlightDecorationsRef = React.useRef([]);

  const hideTooltip = React.useCallback(() => { setTooltip(null); }, []);

  const clearSelectionTimer = React.useCallback(() => {
    if (selectionTimerRef.current) {
      clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = null;
    }
  }, []);

  const showTooltipForSelection = React.useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    const model = editor.getModel();

    if (!selection || selection.isEmpty() || !model) {
      setTooltip(null);
      return;
    }

    const selectedText = model.getValueInRange(selection).replace(/\r\n/g, '\n');
    if (!selectedText.trim()) {
      setTooltip(null);
      return;
    }

    const startPosition = selection.getStartPosition();
    const coords = editor.getScrolledVisiblePosition(startPosition);
    const container = containerRef.current;
    const domNode = editor.getDomNode();

    if (!coords || !container || !domNode) {
      setTooltip(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const editorRect = domNode.getBoundingClientRect();
    const offsetTop = editorRect.top - containerRect.top;
    const offsetLeft = editorRect.left - containerRect.left;

    const top = coords.top + coords.height + offsetTop + 6;
    let left = coords.left + offsetLeft;

    const maxLeft = editorRect.width - TOOLTIP_WIDTH - 16;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;

    setTooltip({ top, left, text: selectedText });
  }, []);

  const scheduleKeyboardTooltip = React.useCallback(() => {
    clearSelectionTimer();
    selectionTimerRef.current = setTimeout(() => {
      selectionTimerRef.current = null;
      showTooltipForSelection();
    }, KEYBOARD_SELECTION_DELAY);
  }, [clearSelectionTimer, showTooltipForSelection]);

  const handleSelectionChange = React.useCallback((event) => {
    if (!event?.selection || event.selection.isEmpty()) {
      clearSelectionTimer();
      setTooltip(null);
      return;
    }

    if (event.source === 'keyboard' || event.source === 'api') {
      setTooltip(null);
      scheduleKeyboardTooltip();
      return;
    }
    if (event.source === 'mouse') {
      clearSelectionTimer();
      setTooltip(null);
    }
  }, [clearSelectionTimer, scheduleKeyboardTooltip, showTooltipForSelection]);

  const attachEditorListeners = React.useCallback((editorInstance) => {
    disposablesRef.current.forEach((d) => d.dispose());
    disposablesRef.current = [
      editorInstance.onDidChangeCursorSelection(handleSelectionChange),
      editorInstance.onDidScrollChange(() => showTooltipForSelection()),
      editorInstance.onDidBlurEditorText(() => setTooltip(null)),
      editorInstance.onMouseDown(() => {
        clearSelectionTimer();
        setTooltip(null);
      }),
      editorInstance.onMouseUp(() => {
        clearSelectionTimer();
        showTooltipForSelection();
      }),
    ];
  }, [clearSelectionTimer, handleSelectionChange, showTooltipForSelection]);

  React.useEffect(() => () => {
    disposablesRef.current.forEach((d) => d.dispose());
    disposablesRef.current = [];
    if (selectionTimerRef.current) {
      clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = null;
    }
    if (editorRef.current) {
      highlightDecorationsRef.current = editorRef.current.deltaDecorations(
        highlightDecorationsRef.current,
        [],
      );
    }
  }, []);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !editor.hasModel()) return;
    const hasValidRange = highlightRange
      && typeof highlightRange.startLineNumber === 'number'
      && typeof highlightRange.startColumn === 'number'
      && typeof highlightRange.endLineNumber === 'number'
      && typeof highlightRange.endColumn === 'number';

    const range = hasValidRange
      ? {
        startLineNumber: highlightRange.startLineNumber,
        startColumn: highlightRange.startColumn,
        endLineNumber: highlightRange.endLineNumber,
        endColumn: highlightRange.endColumn,
      }
      : null;

    const decorations = range
      ? [
        {
          range,
          options: {
            inlineClassName: 'editor-hover-highlight',
          },
        },
      ]
      : [];

    highlightDecorationsRef.current = editor.deltaDecorations(
      highlightDecorationsRef.current,
      decorations,
    );

    if (range) {
      try {
        editor.revealRangeInCenter(range);
      } catch (err) {
        // noop - reveal can throw if editor is disposed during unmount
      }
    }
  }, [highlightRange]);

  return (
    <div className="editor-root" ref={containerRef}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme={dark ? 'vs-dark' : 'light'}
        value={value}
        onMount={(editor) => {
          editorRef.current = editor;
          attachEditorListeners(editor);
          if (
            highlightRange
            && typeof highlightRange.startLineNumber === 'number'
            && typeof highlightRange.startColumn === 'number'
            && typeof highlightRange.endLineNumber === 'number'
            && typeof highlightRange.endColumn === 'number'
            && editor.hasModel()
          ) {
            highlightDecorationsRef.current = editor.deltaDecorations(
              highlightDecorationsRef.current,
              [
                {
                  range: {
                    startLineNumber: highlightRange.startLineNumber,
                    startColumn: highlightRange.startColumn,
                    endLineNumber: highlightRange.endLineNumber,
                    endColumn: highlightRange.endColumn,
                  },
                  options: {
                    inlineClassName: 'editor-hover-highlight',
                  },
                },
              ],
            );
          }
        }}
        onChange={(val) => onChange(val ?? '')}
        onValidate={(markers) => {
          try { onMarkersChange && onMarkersChange(markers || []); } catch {}
        }}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          tabSize: 2,
          automaticLayout: true,
        }}
      />
      {tooltip && (
        <div
          className="editor-selection-tooltip"
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          <button
            type="button"
            className="editor-selection-action"
            onMouseDown={(event) => {
              // Prevent Monaco from clearing selection before click handler runs.
              event.preventDefault();
            }}
            onClick={() => {
              if (onAddSelectionToChat) {
                const selection = editorRef.current?.getSelection();
                const range = selection
                  ? {
                    startLineNumber: selection.startLineNumber,
                    startColumn: selection.startColumn,
                    endLineNumber: selection.endLineNumber,
                    endColumn: selection.endColumn,
                  }
                  : null;
                onAddSelectionToChat({ text: tooltip.text, range });
              }
              hideTooltip();
              editorRef.current?.focus();
            }}
          >
            Add to chat
          </button>
          <button
            type="button"
            className="editor-selection-dismiss"
            onMouseDown={(event) => event.preventDefault()}
            onClick={hideTooltip}
            aria-label="Dismiss selection"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
