export default function extractResponseText(response) {
  if (!response) return '';

  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text;
  }

  const outputs = Array.isArray(response.output) ? response.output : [];
  const chunks = [];

  for (const item of outputs) {
    const content = item?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (typeof block?.text === 'string') {
        chunks.push(block.text);
      }
    }
  }

  return chunks.join('\n');
}
