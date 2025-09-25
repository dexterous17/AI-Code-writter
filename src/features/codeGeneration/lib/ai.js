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
  RESPONSE_REASONING_CONFIG,
  RESPONSE_TEXT_CONFIG,
  TEMPERATURE,
  TOP_P,
} from './ai/constants.js';

export async function generateCodeWithOpenAI({ prompt, apiKey, model = DEFAULT_MODEL, image }) {
  const client = createOpenAIClient(apiKey);
  const input = buildInput({ prompt, image });

  let response;
  try {
    response = await client.responses.create({
      model,
      input,
      max_output_tokens: MAX_OUTPUT_TOKENS,
      text: RESPONSE_TEXT_CONFIG,
      reasoning: RESPONSE_REASONING_CONFIG,
      temperature: TEMPERATURE,
      top_p: TOP_P,
      tools: [],
      store: true,
      include: RESPONSE_INCLUDE_FIELDS,
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
