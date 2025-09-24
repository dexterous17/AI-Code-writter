import { SYSTEM_PROMPT, USER_PROMPT_INTRO } from './constants.js';

export default function buildInput({ prompt, image }) {
  const trimmedPrompt = (prompt ?? '').trim();
  const systemMessage = createSystemMessage();
  const userContent = [];

  if (trimmedPrompt) {
    userContent.push({
      type: 'input_text',
      text: USER_PROMPT_INTRO + trimmedPrompt,
    });
  }

  if (image?.dataUrl) {
    userContent.push({
      type: 'input_image',
      image_url: image.dataUrl,
      detail: 'auto',
    });
  }

  if (userContent.length === 0) {
    throw new Error('Missing prompt or image content');
  }

  const userMessage = {
    role: 'user',
    content: userContent,
  };

  return [systemMessage, userMessage];
}

function createSystemMessage() {
  return {
    role: 'system',
    content: [
      {
        type: 'input_text',
        text: SYSTEM_PROMPT,
      },
    ],
  };
}
