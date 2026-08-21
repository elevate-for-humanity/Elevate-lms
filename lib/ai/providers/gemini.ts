import type { AIProvider, ChatCompletionOptions, ChatCompletionResult } from '../types';

// Keep only currently supported stable Gemini text models. Gemini 2.0 Flash and
// Flash-Lite were shut down in 2026 and were returning 404 in production.
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'];
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Google Gemini provider — free tier available, good fallback.
 */
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const;

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const systemMsg = options.messages.find((m) => m.role === 'system')?.content || '';
    const userMsgs = options.messages.filter((m) => m.role !== 'system');

    const models = options.model ? [options.model] : GEMINI_MODELS;
    let lastError: Error | null = null;

    for (const m of models) {
      try {
        const url = `${GEMINI_API_BASE}/${m}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
            contents: userMsgs.map((msg) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }],
            })),
            generationConfig: {
              temperature: options.temperature ?? 0.7,
              maxOutputTokens: options.maxTokens || 2048,
            },
          }),
        });

        if (!res.ok) {
          const responseText = await res.text().catch(() => '');
          const error = new Error(
            `Gemini ${m} returned ${res.status}${responseText ? `: ${responseText.slice(0, 240)}` : ''}`,
          );
          lastError = error;
          // Capacity/rate-limit and retired/unavailable model failures should
          // fall through to another supported Gemini model first.
          if ([404, 429, 503].includes(res.status)) continue;
          throw error;
        }

        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return {
          content,
          model: m,
          usage: data.usageMetadata
            ? {
                promptTokens: data.usageMetadata.promptTokenCount || 0,
                completionTokens: data.usageMetadata.candidatesTokenCount || 0,
                totalTokens: data.usageMetadata.totalTokenCount || 0,
              }
            : undefined,
        };
      } catch (e) {
        lastError = e as Error;
      }
    }

    throw lastError || new Error('All Gemini models failed');
  }
}
