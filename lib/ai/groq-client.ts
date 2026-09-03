/**
 * lib/ai/groq-client.ts
 *
 * Canonical Groq client factory. Only import from inside lib/ai/.
 * External callers should use aiChat() from ai-service.ts instead.
 */
import Groq from 'groq-sdk';

let _client: Groq | null = null;

export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');
  if (!_client) _client = new Groq({ apiKey });
  return _client;
}

export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}
