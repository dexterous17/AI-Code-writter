export function getSelectionRange(editor) {
  if (!editor) return null;
  const selection = editor.getSelection();
  if (!selection) return null;

  const {
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
  } = selection;

  return {
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
  };
}
