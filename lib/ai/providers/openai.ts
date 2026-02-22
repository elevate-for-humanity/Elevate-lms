import type { AIProvider, AIImageProvider, ChatCompletionOptions, ChatCompletionResult, ImageGenerationOptions, GeneratedImage } from '../types';

/**
 * OpenAI provider — GPT models for chat, DALL-E for images.
 */
export class OpenAIProvider implements AIProvider, AIImageProvider {
  readonly name = 'openai' as const;
  private client: any = null;

  private getClient() {
    if (this.client) return this.client;
    const OpenAI = require('openai').default;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'placeholder-build-key') {
      throw new Error('OPENAI_API_KEY not configured');
    }
    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  isAvailable(): boolean {
    const key = process.env.OPENAI_API_KEY;
    return !!(key && key !== 'placeholder-build-key' && key !== 'sk-Content-key');
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const client = this.getClient();
    const res = await client.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 2048,
    });

    const choice = res.choices[0];
    return {
      content: choice.message.content || '',
      model: res.model,
      usage: res.usage ? {
        promptTokens: res.usage.prompt_tokens,
        completionTokens: res.usage.completion_tokens,
        totalTokens: res.usage.total_tokens,
      } : undefined,
    };
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
