import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'sk-Content-key' || apiKey === 'placeholder-build-key') {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.');
  }

  if (!client) {
    client = new OpenAI({
      apiKey: apiKey,
    });
  }

  return client;
}

export function isOpenAIConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  return !!(apiKey && apiKey !== 'sk-Content-key' && apiKey !== 'placeholder-build-key');
}

// Safe client that won't throw during build
export function getSafeOpenAIClient(): OpenAI | null {
  try {
    return isOpenAIConfigured() ? getOpenAIClient() : null;
  } catch (error) {
    return null;
  }
}
