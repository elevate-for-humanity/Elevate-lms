import type { AIProvider, ChatCompletionOptions, ChatCompletionResult } from '../types';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

type ClaudeResponse = {
  model?: string;
  content?: Array<{ type?: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
};

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic' as const;

  isAvailable(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const credential = process.env.ANTHROPIC_API_KEY?.trim();
    if (!credential) throw new Error('ANTHROPIC_API_KEY not configured');

    const system = options.messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content)
      .join('\n\n')
      .trim();
    const messages = options.messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({ role: message.role, content: message.content }));

    const headers = new Headers();
    headers.set('content-type', 'application/json');
    headers.set('anthropic-version', API_VERSION);
    headers.set('x-api-key', credential);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: options.model?.startsWith('claude-')
          ? options.model
          : process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL,
        max_tokens: Math.min(Math.max(options.maxTokens ?? 2048, 1), 8192),
        ...(typeof options.temperature === 'number'
          ? { temperature: Math.min(Math.max(options.temperature, 0), 1) }
          : {}),
        ...(system ? { system } : {}),
        messages,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const payload = (await response.json().catch(() => ({}))) as ClaudeResponse;
    if (!response.ok) {
      throw new Error(`Anthropic API ${response.status}: ${payload.error?.message || 'request failed'}`);
    }

    const content = (payload.content ?? [])
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text)
      .join('\n')
      .trim();
    const promptTokens = payload.usage?.input_tokens ?? 0;
    const completionTokens = payload.usage?.output_tokens ?? 0;

    return {
      content,
      model: payload.model || process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }
}
