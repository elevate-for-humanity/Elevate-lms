import type { AIProvider, ChatCompletionOptions, ChatCompletionResult } from '../types';

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic' as const;

  isAvailable(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  }

  async chat(_options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    throw new Error('Anthropic provider is not initialized.');
  }
}
