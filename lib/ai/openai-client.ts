import OpenAI from 'openai';

// Canonical placeholder sentinels — must match lib/ai/providers/openai.ts and app/api/grants/draft/route.ts
const PLACEHOLDER_KEYS = ['placeholder-build-key', 'sk-placeholder-build-key'];

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || PLACEHOLDER_KEYS.includes(apiKey)) {
    throw new Error(
      'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
    );
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

export function isOpenAIConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  return !!(apiKey && !PLACEHOLDER_KEYS.includes(apiKey));
}

// Safe client that won't throw during build
export function getSafeOpenAIClient(): OpenAI | null {
  try {
    return isOpenAIConfigured() ? getOpenAIClient() : null;
  } catch (error) {
    return null;
  }
}
