const DEFAULT_OPTIONS = {
  headLines: 4,
  tailLines: 2,
  maxChars: 400,
};

function normalizeText(value) {
  return (value ?? '').replace(/\r\n/g, '\n');
}

export function formatSnippetPreview(text, options = {}) {
  const { headLines, tailLines, maxChars } = { ...DEFAULT_OPTIONS, ...options };
  const normalized = normalizeText(text).trimEnd();
  if (!normalized) return '';

  const lines = normalized.split('\n');
  const shouldTruncateLines = lines.length > headLines + tailLines;
  let preview = normalized;

  if (shouldTruncateLines) {
    const head = lines.slice(0, headLines);
    const tail = lines.slice(-tailLines);
    preview = [...head, '...', ...tail].join('\n');
  }

  if (preview.length > maxChars) {
    const half = Math.floor(maxChars / 2);
    const prefix = preview.slice(0, half).trimEnd();
    const suffix = preview.slice(-half).trimStart();
    preview = `${prefix}\n...\n${suffix}`;
  }

  return preview;
}
