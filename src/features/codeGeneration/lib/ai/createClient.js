import OpenAI from 'openai';

export default function createOpenAIClient(apiKey) {
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}
