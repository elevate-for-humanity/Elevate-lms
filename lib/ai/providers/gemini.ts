import type { AIProvider, ChatCompletionOptions, ChatCompletionResult } from '../types';

// Keep currently supported Gemini text models in a cost-efficient order for
// long-form Course Builder generation. Older Gemini 2.x/2.5 models have been
// retired or restricted for new API users and were returning 404 in production.
const GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.1-pro-preview',
];
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Google Gemini provider — free/low-cost Flash models are preferred for
 * high-volume Course Builder generation, with larger models as fallbacks.
 */
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const;

  isAvailable(): boolean {
    const key = process.env.GEMINI_API_KEY?.trim();
    return Boolean(key && key.length > 10);
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const systemMsg = options.messages.find((m) => m.role === 'system')?.content || '';
    const userMsgs = options.messages.filter((m) => m.role !== 'system');

    // Only honor an explicit model when it is actually a Gemini model. Course
    // Builder callers often use provider-neutral/OpenAI model labels, which must
    // not be sent to Google's model endpoint.
    const models = options.model?.startsWith('gemini-') ? [options.model] : GEMINI_MODELS;
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
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!res.ok) {
          const responseText = await res.text().catch(() => '');
          const error = new Error(
            `Gemini ${m} returned ${res.status}${responseText ? `: ${responseText.slice(0, 240)}` : ''}`,
          );
          lastError = error;
          // Retired/unavailable/capacity/rate-limit failures fall through to the
          // next supported Gemini model before the global provider circuit opens.
          if ([404, 429, 503].includes(res.status)) continue;
          throw error;
        }

        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part?.text || '')
          .join('') || '';

        if (!content.trim()) {
          lastError = new Error(`Gemini ${m} returned no text content`);
          continue;
        }

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
