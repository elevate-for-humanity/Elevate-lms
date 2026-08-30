import Groq from 'groq-sdk';
import type {
  AIProvider,
  ChatCompletionOptions,
  ChatCompletionResult,
} from '../types';
import { normalizeStructuredOutput, requestsJson } from './structured-output';

/**
 * Groq provider — fast fallback inference for Elevate.
 *
 * GROQ_MODEL can override the default without changing application code.
 * The default intentionally uses a model that is available to the configured
 * Elevate Groq account instead of the retired/inaccessible 70B Llama default.
 */
export class GroqProvider implements AIProvider {
  readonly name = 'groq' as const;
  private client: Groq | null = null;

  private static readonly PLACEHOLDER_KEYS = ['placeholder-build-key', 'sk-placeholder-build-key'];

  private getClient(): Groq {
    if (this.client) return this.client;
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || GroqProvider.PLACEHOLDER_KEYS.includes(apiKey)) {
      throw new Error('GROQ_API_KEY not configured');
    }
    this.client = new Groq({ apiKey });
    return this.client;
  }

  isAvailable(): boolean {
    const key = process.env.GROQ_API_KEY;
    return !!(key && !GroqProvider.PLACEHOLDER_KEYS.includes(key) && key.length > 10);
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const client = this.getClient();
    const model = mapModel(options.model);

    const res = await client.chat.completions.create({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 2048,
      ...(requestsJson(options) ? { response_format: { type: 'json_object' as const } } : {}),
    });

    const choice = res.choices[0];
    return {
      content: normalizeStructuredOutput(choice.message.content || '', options),
      model: res.model,
      usage: res.usage
        ? {
            promptTokens: res.usage.prompt_tokens,
            completionTokens: res.usage.completion_tokens,
            totalTokens: res.usage.total_tokens,
          }
        : undefined,
    };
  }
}

function configuredGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b';
}

/** Map vendor-specific model hints to the configured Groq model. */
function mapModel(model?: string): string {
  const fallback = configuredGroqModel();
  if (!model) return fallback;

  const normalized = model.trim();

  // Preserve an explicit Groq model only when the caller intentionally passed
  // one. Generic OpenAI/Google/Anthropic model names must never leak through to
  // Groq because they can cause model_not_found failures.
  if (
    normalized.startsWith('openai/') ||
    normalized.startsWith('qwen/') ||
    normalized.startsWith('meta-llama/') ||
    normalized.startsWith('llama-') ||
    normalized.startsWith('mixtral') ||
    normalized.startsWith('gemma')
  ) {
    return normalized;
  }

  return fallback;
}
