const IMPORT_REGEX = /^\s*import\s+/;

export default function sanitizeGeneratedCode(raw) {
  const constrained = ensureLiveCodeConstraints(raw);
  if (!/\brender\s*\(\s*</.test(constrained)) {
    return `${constrained}\n\nrender(<Generated />);`;
  }
  return constrained;
}

function ensureLiveCodeConstraints(code) {
  const cleaned = stripCodeFences(code);
  if (/\bimport\b/.test(cleaned)) {
    return cleaned
      .split('\n')
      .filter((line) => !IMPORT_REGEX.test(line))
      .join('\n');
  }
  return cleaned;
}

function stripCodeFences(text) {
  if (!text) return '';
  return text
    .replace(/^```[a-zA-Z]*\n?/g, '')
    .replace(/```$/g, '')
    .trim();
}
