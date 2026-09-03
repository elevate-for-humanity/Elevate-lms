/**
 * lib/anthropic-client.ts
 *
 * Anthropic Claude inference client — tertiary fallback for content generation.
 * Used when both Groq and Gemini are unavailable or rate-limited.
 */

import Anthropic from '@anthropic-ai/sdk';
import { extractJSON } from '@/lib/extract-json';

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Generate structured JSON content via Claude.
 * Uses claude-3-5-haiku for speed and cost efficiency.
 */
export async function anthropicJSON<T = unknown>(prompt: string): Promise<T> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 8192,
    system:
      'You are a professional curriculum architect. Always respond with valid JSON only. No markdown, no prose, no code fences.',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '{}';
  return extractJSON<T>(raw);
}
