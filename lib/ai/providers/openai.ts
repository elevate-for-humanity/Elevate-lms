import OpenAI from 'openai';
import type {
  AIProvider,
  AIImageProvider,
  ChatCompletionOptions,
  ChatCompletionResult,
  ImageGenerationOptions,
  GeneratedImage,
} from '../types';
import { normalizeStructuredOutput, requestsJson } from './structured-output';

/**
 * OpenAI provider — GPT models for chat, DALL-E for images.
 */
export class OpenAIProvider implements AIProvider, AIImageProvider {
  readonly name = 'openai' as const;
  private client: OpenAI | null = null;

  private static readonly PLACEHOLDER_KEYS = ['placeholder-build-key', 'sk-placeholder-build-key'];

  private getClient(): OpenAI {
    if (this.client) return this.client;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || OpenAIProvider.PLACEHOLDER_KEYS.includes(apiKey)) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  isAvailable(): boolean {
    const key = process.env.OPENAI_API_KEY;
    return !!(key && !OpenAIProvider.PLACEHOLDER_KEYS.includes(key));
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const client = this.getClient();
    const res = await client.chat.completions.create({
      model: options.model || 'gpt-4.1-mini',
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

  /**
   * Returns a streaming chat completion as an async iterable of content deltas.
   * Each yielded string is a raw text chunk from the model.
   */
  async *chatStream(options: ChatCompletionOptions): AsyncIterable<string> {
    const client = this.getClient();
    const stream = await client.chat.completions.create({
      model: options.model || 'gpt-4.1-mini',
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 2048,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  /**
   * Stream a chat completion with OpenAI function calling.
   * Yields ToolStreamEvent — text deltas and tool_call events.
   */
  async *chatStreamWithTools(options: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    tools: Array<{ type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } }>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): AsyncIterable<{ type: 'delta'; content: string } | { type: 'tool_call'; name: string; args: Record<string, unknown> }> {
    const client = this.getClient();
    const stream = await client.chat.completions.create({
      model: options.model ?? 'gpt-4.1-mini',
      messages: options.messages,
      tools: options.tools as OpenAI.Chat.Completions.ChatCompletionTool[],
      tool_choice: 'auto',
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1200,
      stream: true,
    });

    const toolCallAccum: Record<number, { name: string; args: string }> = {};

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        yield { type: 'delta', content: delta.content };
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!toolCallAccum[idx]) toolCallAccum[idx] = { name: '', args: '' };
          if (tc.function?.name) toolCallAccum[idx].name += tc.function.name;
          if (tc.function?.arguments) toolCallAccum[idx].args += tc.function.arguments;
        }
      }

      if (chunk.choices[0]?.finish_reason === 'tool_calls') {
        for (const tc of Object.values(toolCallAccum)) {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(tc.args); } catch { /* malformed */ }
          yield { type: 'tool_call', name: tc.name, args };
        }
      }
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
    const client = this.getClient();
    const res = await client.images.generate({
      model: 'dall-e-3',
      prompt: options.prompt,
      n: options.count || 1,
      size: options.size || '1024x1024',
      response_format: options.format || 'url',
      style: options.style || 'natural',
    });

    return res.data.map((img: any) => ({
      url: img.url,
      b64Json: img.b64_json,
    }));
  }
}
