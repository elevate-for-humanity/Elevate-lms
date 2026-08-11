import type { AIProvider, ChatCompletionOptions, ChatCompletionResult } from '../types';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

type ClaudeTextBlock = { type: 'text'; text: string };
type ClaudeToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };
type ClaudeContentBlock = ClaudeTextBlock | ClaudeToolUseBlock | { type?: string; [key: string]: unknown };

type ClaudeResponse = {
  model?: string;
  content?: ClaudeContentBlock[];
  stop_reason?: string | null;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
};

export type AnthropicToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type AnthropicToolEvent =
  | { type: 'delta'; content: string }
  | { type: 'tool_call'; name: string; args: Record<string, unknown>; callId?: string };

function modelFor(options: { model?: string }): string {
  return options.model?.startsWith('claude-')
    ? options.model
    : process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

function headersForCredential(credential: string): Headers {
  const headers = new Headers();
  headers.set('content-type', 'application/json');
  headers.set('anthropic-version', API_VERSION);
  headers.set('x-api-key', credential);
  return headers;
}

function splitMessages(options: ChatCompletionOptions) {
  const system = options.messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n')
    .trim();
  const messages = options.messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({ role: message.role, content: message.content }));
  return { system, messages };
}

async function requestClaude(body: Record<string, unknown>): Promise<ClaudeResponse> {
  const credential = process.env.ANTHROPIC_API_KEY?.trim();
  if (!credential) throw new Error('ANTHROPIC_API_KEY not configured');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: headersForCredential(credential),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });

  const payload = (await response.json().catch(() => ({}))) as ClaudeResponse;
  if (!response.ok) {
    throw new Error(`Anthropic API ${response.status}: ${payload.error?.message || 'request failed'}`);
  }
  return payload;
}

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic' as const;

  isAvailable(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const { system, messages } = splitMessages(options);
    if (!messages.length) throw new Error('Anthropic request requires a user or assistant message');

    const model = modelFor(options);
    const payload = await requestClaude({
      model,
      max_tokens: Math.min(Math.max(options.maxTokens ?? 2048, 1), 8192),
      ...(typeof options.temperature === 'number'
        ? { temperature: Math.min(Math.max(options.temperature, 0), 1) }
        : {}),
      ...(system ? { system } : {}),
      messages,
    });

    const content = (payload.content ?? [])
      .filter((block): block is ClaudeTextBlock => block.type === 'text' && typeof (block as ClaudeTextBlock).text === 'string')
      .map((block) => block.text)
      .join('\n')
      .trim();
    const promptTokens = payload.usage?.input_tokens ?? 0;
    const completionTokens = payload.usage?.output_tokens ?? 0;

    return {
      content,
      model: payload.model || model,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }

  async *chatWithTools(options: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    tools: AnthropicToolDefinition[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): AsyncIterable<AnthropicToolEvent> {
    const system = options.messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content)
      .join('\n\n')
      .trim();
    const messages = options.messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({ role: message.role, content: message.content }));

    const payload = await requestClaude({
      model: modelFor(options),
      max_tokens: Math.min(Math.max(options.maxTokens ?? 2048, 1), 8192),
      ...(typeof options.temperature === 'number'
        ? { temperature: Math.min(Math.max(options.temperature, 0), 1) }
        : {}),
      ...(system ? { system } : {}),
      messages,
      tools: options.tools.map((tool) => ({
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters,
      })),
      tool_choice: { type: 'auto' },
    });

    for (const block of payload.content ?? []) {
      if (block.type === 'text' && typeof (block as ClaudeTextBlock).text === 'string') {
        yield { type: 'delta', content: (block as ClaudeTextBlock).text };
      } else if (block.type === 'tool_use') {
        const tool = block as ClaudeToolUseBlock;
        yield {
          type: 'tool_call',
          name: tool.name,
          args: tool.input ?? {},
          callId: tool.id,
        };
      }
    }
  }
}
