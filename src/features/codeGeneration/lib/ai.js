/*
 * Thin browser-side wrapper around the OpenAI Responses API that orchestrates
 * client creation, message composition, and result sanitisation.
 */
import buildInput from './ai/buildInput.js';
import createOpenAIClient from './ai/createClient.js';
import sanitizeGeneratedCode from './ai/sanitizeCode.js';
import extractResponseText from './ai/parseResponse.js';
import {
  DEFAULT_MODEL,
  MAX_OUTPUT_TOKENS,
  RESPONSE_INCLUDE_FIELDS,
  TEMPERATURE,
} from './ai/constants.js';

export async function generateCodeWithOpenAI({ prompt, apiKey, model = DEFAULT_MODEL, image }) {
  const client = createOpenAIClient(apiKey);
  const input = buildInput({ prompt, image });

  let response;
  try {
    response = await client.responses.create({
      model,
      input,
      temperature: TEMPERATURE,
      max_output_tokens: MAX_OUTPUT_TOKENS,
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

  const raw = extractResponseText(response);
  return sanitizeGeneratedCode(raw);
}
