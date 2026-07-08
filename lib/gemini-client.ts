/**
 * lib/gemini-client.ts
 *
 * Google Gemini inference client — fallback for Groq in content generation.
 * Uses a small model cascade so content generation can keep moving when a
 * single Gemini model is unavailable or rate-limited.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractJSON } from '@/lib/extract-json';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

let _client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    _client = new GoogleGenerativeAI(apiKey);
  }
  return _client;
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

/**
 * Generate structured JSON content via Gemini.
 * Uses gemini-1.5-flash — fast, free, reliable JSON output.
 */
export async function geminiJSON<T = unknown>(prompt: string): Promise<T> {
  const genAI = getGeminiClient();
  let lastError: unknown = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
        systemInstruction:
          'You are a professional curriculum architect. Always respond with valid JSON only. No markdown, no prose, no code fences.',
      });

      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();
      return extractJSON<T>(raw);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All Gemini models failed');
}
