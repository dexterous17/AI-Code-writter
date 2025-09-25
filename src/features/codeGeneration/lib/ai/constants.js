export const DEFAULT_MODEL = 'gpt-4.1';
export const MAX_OUTPUT_TOKENS = 2048;
export const RESPONSE_INCLUDE_FIELDS = [];
export const RESPONSE_TEXT_CONFIG = {
  format: { type: 'text' },
};
export const RESPONSE_REASONING_CONFIG = {};
export const TEMPERATURE = 1;
export const TOP_P = 1;

export const SYSTEM_PROMPT = [
  'You generate React code for a live playground that uses react-live with noInline mode.',
  'Constraints:',
  '- Do NOT use imports; React is available as a global.',
  "- Define a single root component named 'Generated'.",
  "- End with: render(<Generated />);",
  '- Use only browser-safe APIs.',
  '- Return ONLY runnable code. No explanations, no comments, no Markdown fences.',
  'If the user provides an image, treat it as a design reference when relevant.',
].join('\n');

export const USER_PROMPT_INTRO = 'Build the component described below. Follow all constraints strictly.\nDescription: ';
