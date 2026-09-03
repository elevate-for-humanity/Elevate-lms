/**
 * lib/groq-client.ts
 *
 * Groq inference client — primary AI provider for content generation.
 * Free tier: 14,400 req/day, 6,000 tokens/min.
 * Model: llama-3.3-70b-versatile
 *
 * Fallback: Google Gemini (gemini-1.5-flash) when Groq fails or is unconfigured.
 */

import Groq from 'groq-sdk';
import { geminiJSON, isGeminiConfigured } from '@/lib/gemini-client';
import { anthropicJSON, isAnthropicConfigured } from '@/lib/ai/anthropic-client';
import { logger } from '@/lib/logger';

let _client: Groq | null = null;

export function getGroqClient(): Groq {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not set');
    _client = new Groq({ apiKey });
  }
  return _client;
}

export function isGroqConfigured(): boolean {
  const key = process.env.GROQ_API_KEY;
  return !!key && key !== 'skip' && key.length > 10;
}

/**
 * Generate structured JSON content via Groq, with Gemini as fallback.
 *
 * Tries Groq first. On any error (rate limit, network, parse failure),
 * retries once with Gemini if GEMINI_API_KEY is configured.
 */
export async function groqJSON<T = unknown>(prompt: string): Promise<T> {
  // ── Primary: Groq ─────────────────────────────────────────────────────────
  if (isGroqConfigured()) {
    try {
      const groq = getGroqClient();
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional curriculum architect. Always respond with valid JSON only. No markdown, no prose, no code fences.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      });
      const raw = completion.choices[0]?.message?.content ?? '{}';
      return JSON.parse(raw) as T;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logger.warn(`[groq-client] Groq failed (${reason}) — falling back to Anthropic`);
    }
  }

  // ── Fallback 1: Anthropic Claude ─────────────────────────────────────────
  if (isAnthropicConfigured()) {
    try {
      return await anthropicJSON<T>(prompt);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logger.warn(`[groq-client] Anthropic failed (${reason}) — falling back to Gemini`);
    }
  }

  // ── Fallback 2: Gemini ────────────────────────────────────────────────────
  if (isGeminiConfigured()) {
    return geminiJSON<T>(prompt);
  }

  throw new Error('No AI provider available. Set GROQ_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY.');
}
