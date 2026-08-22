import type { AIProvider, ChatCompletionOptions, ChatCompletionResult } from '../types';

const GOOGLE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
];
const GOOGLE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Secondary Google Generative Language provider.
 *
 * This intentionally uses GOOGLE_CLOUD_API_KEY rather than GEMINI_API_KEY so
 * Course Builder has a genuinely independent Google credential path. It uses
 * the same public Generative Language API contract and remains separate from
 * the primary GeminiProvider for failover/quarantine purposes.
 */
export class GoogleProvider implements AIProvider {
  readonly name = 'google' as const;

  isAvailable(): boolean {
    const key = process.env.GOOGLE_CLOUD_API_KEY?.trim();
    return Boolean(key && key.length > 10);
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY?.trim();
    if (!apiKey) throw new Error('GOOGLE_CLOUD_API_KEY not configured');

    const systemMsg = options.messages.find((message) => message.role === 'system')?.content || '';
    const userMsgs = options.messages.filter((message) => message.role !== 'system');
    const models = options.model?.startsWith('gemini-') ? [options.model] : GOOGLE_MODELS;
    let lastError: Error | null = null;

    for (const model of models) {
      try {
        const response = await fetch(`${GOOGLE_API_BASE}/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
            contents: userMsgs.map((message) => ({
              role: message.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: message.content }],
            })),
            generationConfig: {
              temperature: options.temperature ?? 0.55,
              maxOutputTokens: options.maxTokens || 4096,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          lastError = new Error(`Google ${model} returned ${response.status}${body ? `: ${body.slice(0, 240)}` : ''}`);
          if ([404, 429, 503].includes(response.status)) continue;
          throw lastError;
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text || '')
          .join('') || '';
        if (!content.trim()) {
          lastError = new Error(`Google ${model} returned no text content`);
          continue;
        }

        return {
          content,
          model,
          usage: data.usageMetadata
            ? {
                promptTokens: data.usageMetadata.promptTokenCount || 0,
                completionTokens: data.usageMetadata.candidatesTokenCount || 0,
                totalTokens: data.usageMetadata.totalTokenCount || 0,
              }
            : undefined,
        };
      } catch (error) {
        lastError = error as Error;
      }
    }

    throw lastError || new Error('All Google fallback models failed');
  }
}
