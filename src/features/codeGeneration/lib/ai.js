/*
 * Thin browser-side wrapper around OpenAI responses API used to request
 * runnable React code based on a textual prompt provided by the user.
 */
import OpenAI from 'openai';

const RESPONSE_INCLUDE_FIELDS = [
  'reasoning.encrypted_content',
  'web_search_call.action.sources',
];

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

export async function generateCodeWithOpenAI({ prompt, apiKey, model = 'gpt-5-codex', image }) {
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

  const systemMessage = {
    role: 'system',
    content: [
      {
        type: 'input_text',
        text: system,
      },
    ],
  };

  const userContent = [];
  for (const part of userParts) {
    if (part.type === 'text') {
      userContent.push({ type: 'input_text', text: part.text });
    } else if (part.type === 'image_url' && part.image_url?.url) {
      userContent.push({
        type: 'input_image',
        image_url: part.image_url.url,
        detail: 'auto',
      });
    }
  }

  if (userContent.length === 0) {
    throw new Error('Missing prompt or image content');
  }

  const userMessage = {
    role: 'user',
    content: userContent,
  };

  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  let response;
  try {
    response = await client.responses.create({
      model,
      input: [systemMessage, userMessage],
      temperature: 0.2,
      max_output_tokens: 800,
      modalities: ['text'],
      store: true,
      include: RESPONSE_INCLUDE_FIELDS,
      reasoning: {},
      tools: [],
    });
  } catch (err) {
    if (err?.status && err?.error?.message) {
      throw new Error(err.error.message);
    }
    throw new Error(err?.message || 'Network error contacting OpenAI');
  }

  const content = extractResponseText(response);
  const code = ensureLiveCodeConstraints(content);

  // As a last guard, if the model forgot to call render, add a minimal wrapper
  if (!/\brender\s*\(\s*</.test(code)) {
    // Try to append render(<Generated />);
    return `${code}\n\nrender(<Generated />);`;
  }
  return code;
}

function extractResponseText(response) {
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
