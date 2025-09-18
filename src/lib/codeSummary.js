/*
 * Utilities that summarise two code snapshots so the UI can show how many
 * lines and characters changed after an AI generation completes.
 */
export function summarizeCodeChange(previous = '', next = '') {
  const prevLines = previous.split(/\r?\n/);
  const nextLines = next.split(/\r?\n/);
  const prevLineCount = prevLines.length;
  const nextLineCount = nextLines.length;
  const lineDelta = nextLineCount - prevLineCount;
  const prevChars = previous.length;
  const nextChars = next.length;
  const charDelta = nextChars - prevChars;

  let changedLines = 0;
  const max = Math.max(prevLineCount, nextLineCount);
  for (let i = 0; i < max; i += 1) {
    if (prevLines[i] === nextLines[i]) continue;
    changedLines += 1;
  }

  return {
    prevLineCount,
    nextLineCount,
    lineDelta,
    prevChars,
    nextChars,
    charDelta,
    changedLines,
  };
}
