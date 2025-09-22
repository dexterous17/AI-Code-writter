/*
 * Thin browser-side wrapper around OpenAI chat completions used to request
 * runnable React code based on a textual prompt provided by the user.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function stripCodeFences(text) {
  if (!text) return '';
  // Remove ```jsx or ```javascript fences
  return text
    .replace(/^```[a-zA-Z]*\n?/g, '')
    .replace(/```$/g, '')
    .trim();
}

function ensureLiveCodeConstraints(code) {
  const cleaned = stripCodeFences(code);
  // react-live in noInline mode requires `render(...)` call.
  // Also ensure no imports are present.
  if (/\bimport\b/.test(cleaned)) {
    // If imports are present, we can't use them in this environment; drop them.
    // Extremely simple removal: strip lines starting with import
    // This won't handle side-effects, but keeps things working.
    const noImports = cleaned
      .split('\n')
      .filter((l) => !/^\s*import\s+/.test(l))
      .join('\n');
    return noImports;
  }
  return cleaned;
}

export async function generateCodeWithOpenAI({ prompt, apiKey, model = 'gpt-4o-mini', image }) {
  if (!apiKey) throw new Error('Missing OpenAI API key');

  const system = [
    'You generate React code for a live playground that uses react-live with noInline mode.',
    'Constraints:',
    '- Do NOT use imports; React is available as a global.',
    "- Define a single root component named 'Generated'.",
    "- End with: render(<Generated />);",
    '- Use only browser-safe APIs.',
    '- Return ONLY runnable code. No explanations, no comments, no Markdown fences.',
    'If the user provides an image, treat it as a design reference when relevant.',
  ].join('\n');

  const user = [
    'Build the component described below. Follow all constraints strictly.',
    `Description: ${prompt}`,
  ].join('\n');

  const userParts = [];
  if ((prompt ?? '').trim()) {
    userParts.push({ type: 'text', text: user });
  }
  if (image?.dataUrl) {
    userParts.push({
      type: 'image_url',
      image_url: { url: image.dataUrl },
    });
  }

  if (userParts.length === 0) {
    throw new Error('Missing prompt or image content');
  }

  const userMessage = userParts.length === 1 && userParts[0].type === 'text'
    ? { role: 'user', content: userParts[0].text }
    : { role: 'user', content: userParts };

  let res;
  try {
    res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          userMessage,
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });
  } catch (e) {
    throw new Error('Network error contacting OpenAI');
  }

  if (!res.ok) {
    // Try to read JSON error format
    let message = `OpenAI error ${res.status}`;
    try {
      const j = await res.json();
      message = j?.error?.message || message;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) message = `${message}: ${text}`;
    }
    throw new Error(message);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  const code = ensureLiveCodeConstraints(content);

  // As a last guard, if the model forgot to call render, add a minimal wrapper
  if (!/\brender\s*\(\s*</.test(code)) {
    // Try to append render(<Generated />);
    return `${code}\n\nrender(<Generated />);`;
  }
  return code;
}
