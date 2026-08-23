import type { AIProvider, ChatCompletionOptions, ChatCompletionResult } from '../types';
import { normalizeStructuredOutput } from './structured-output';

const MODELS = [
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/meta/llama-3.2-3b-instruct',
];

function contentText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return ''; }
  }
  return value == null ? '' : String(value);
}

/** Cloudflare Workers AI provider used as a free/low-cost failover path. */
export class CloudflareProvider implements AIProvider {
  readonly name = 'cloudflare' as const;

  isAvailable(): boolean {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const token = (process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN)?.trim();
    return Boolean(accountId && token && accountId.length > 8 && token.length > 10);
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const token = (process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN)?.trim();
    if (!accountId || !token) throw new Error('Cloudflare Workers AI credentials not configured');

    const models = options.model?.startsWith('@cf/') ? [options.model] : MODELS;
    let lastError: Error | null = null;

    for (const model of models) {
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: options.messages,
              temperature: options.temperature ?? 0.5,
              max_tokens: options.maxTokens || 4096,
            }),
          },
        );
        if (!response.ok) {
          const body = await response.text().catch(() => '');
          lastError = new Error(`Cloudflare ${model} returned ${response.status}${body ? `: ${body.slice(0, 240)}` : ''}`);
          if ([404, 429, 503].includes(response.status)) continue;
          throw lastError;
        }

        const payload = await response.json();
        const rawContent = payload?.result?.response ?? payload?.result?.text ?? '';
        const content = contentText(rawContent);
        if (!content.trim()) {
          lastError = new Error(`Cloudflare ${model} returned no text content`);
          continue;
        }
        return { content: normalizeStructuredOutput(content, options), model };
      } catch (error) {
        lastError = error as Error;
      }
    }

    throw lastError || new Error('All Cloudflare Workers AI models failed');
  }
}
