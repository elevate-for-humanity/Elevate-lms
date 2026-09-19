import OpenAI from 'openai';
import type { AIProvider, ChatCompletionOptions, ChatCompletionResult } from '../types';
import { requirePaidInferenceContext } from '../paid-inference-context';
import { normalizeStructuredOutput, requestsJson } from './structured-output';
import { getXAIAPIKey, isXAIConfigured } from '../xai-config';

/** xAI Grok through its OpenAI-compatible API. */
export class XAIProvider implements AIProvider {
  readonly name = 'xai' as const;
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    requirePaidInferenceContext('xai');
    if (this.client) return this.client;
    const apiKey = getXAIAPIKey();
    if (!apiKey || apiKey.length < 12) throw new Error('XAI_API_KEY not configured');
    this.client = new OpenAI({ apiKey, baseURL: 'https://api.x.ai/v1' });
    return this.client;
  }

  isAvailable(): boolean {
    return isXAIConfigured();
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const response = await this.getClient().chat.completions.create({
      model: options.model?.startsWith('grok-')
        ? options.model
        : process.env.XAI_MODEL?.trim() || 'grok-4.6',
      messages: options.messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 4096,
      ...(requestsJson(options) ? { response_format: { type: 'json_object' as const } } : {}),
    });
    const choice = response.choices[0];
    if (!choice) throw new Error('xAI returned no completion choice');
    return {
      content: normalizeStructuredOutput(choice.message.content || '', options),
      model: response.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }
}
