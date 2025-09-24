import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KEYBOARD_SELECTION_DELAY,
  TOOLTIP_HORIZONTAL_PADDING,
  TOOLTIP_VERTICAL_OFFSET,
  TOOLTIP_WIDTH,
} from './constants.js';

export default function useSelectionTooltip({ editorRef, containerRef }) {
  const [tooltip, setTooltip] = useState(null);
  const selectionTimerRef = useRef(null);
  const disposablesRef = useRef([]);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  const clearSelectionTimer = useCallback(() => {
    if (selectionTimerRef.current) {
      clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = null;
    }
  }, []);

  const showTooltipForSelection = useCallback(() => {
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

    const top = coords.top + coords.height + offsetTop + TOOLTIP_VERTICAL_OFFSET;
    let left = coords.left + offsetLeft;

    const maxLeft = editorRect.width - TOOLTIP_WIDTH - TOOLTIP_HORIZONTAL_PADDING * 2;
    if (left > maxLeft) left = maxLeft;
    if (left < TOOLTIP_HORIZONTAL_PADDING) left = TOOLTIP_HORIZONTAL_PADDING;

    setTooltip({ top, left, text: selectedText });
  }, [containerRef, editorRef]);

  const scheduleKeyboardTooltip = useCallback(() => {
    clearSelectionTimer();
    selectionTimerRef.current = setTimeout(() => {
      selectionTimerRef.current = null;
      showTooltipForSelection();
    }, KEYBOARD_SELECTION_DELAY);
  }, [clearSelectionTimer, showTooltipForSelection]);

  const handleSelectionChange = useCallback((event) => {
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
  }, [clearSelectionTimer, scheduleKeyboardTooltip]);

  const attachEditorListeners = useCallback((editorInstance) => {
    disposablesRef.current.forEach((disposable) => disposable.dispose());
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

  useEffect(() => () => {
    disposablesRef.current.forEach((disposable) => disposable.dispose());
    disposablesRef.current = [];
    clearSelectionTimer();
  }, [clearSelectionTimer]);

  return {
    tooltip,
    hideTooltip,
    attachEditorListeners,
  };
}
