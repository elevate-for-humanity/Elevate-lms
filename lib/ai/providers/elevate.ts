import type { AIProvider, ChatCompletionOptions, ChatCompletionResult } from '../types';
import { normalizeStructuredOutput } from './structured-output';
import { requestsJson } from './structured-output';

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_CONTEXT_TOKENS = 8192;
const COMPLETION_SAFETY_TOKENS = 512;

function requestTimeoutMs(): number {
  const configured = Number.parseInt(process.env.ELEVATE_LLM_TIMEOUT_MS ?? '', 10);
  if (!Number.isFinite(configured)) return DEFAULT_TIMEOUT_MS;
  return Math.min(900_000, Math.max(30_000, configured));
}
const SERVED_MODEL = 'elevate-local';

function configuredContextTokens(): number {
  const configured = Number.parseInt(process.env.ELEVATE_LLM_CONTEXT_TOKENS ?? '', 10);
  if (!Number.isFinite(configured)) return DEFAULT_CONTEXT_TOKENS;
  return Math.max(2048, configured);
}

/**
 * vLLM rejects requests when prompt + requested completion exceeds the served
 * model context window. Estimate conservatively and reserve a safety margin so
 * callers can request rich output without needing to know the active model's
 * context size.
 */
export function elevateCompletionBudget(options: ChatCompletionOptions): number {
  const promptCharacters = options.messages.reduce(
    (total, message) => total + message.content.length,
    0,
  );
  const estimatedPromptTokens =
    Math.ceil(promptCharacters / 3) + options.messages.length * 12;
  const available = configuredContextTokens() - estimatedPromptTokens - COMPLETION_SAFETY_TOKENS;
  if (available < 256) {
    throw new Error(
      `Elevate LLM prompt is too large for the configured ${configuredContextTokens()}-token context window`,
    );
  }

  const requested = options.maxTokens ?? 4096;
  return Math.max(1, Math.min(requested, available));
}

type OpenAIChatChoice = {
  message?: { content?: string | null };
  finish_reason?: string | null;
};

type OpenAIChatResponse = {
  model?: string;
  choices?: OpenAIChatChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
};

function endpoint(): string | null {
  const raw = process.env.ELEVATE_LLM_URL?.trim();
  if (!raw) return null;
  const base = raw.replace(/\/+$/, '');
  try {
    const url = new URL(base);
    if (/(^|\.)(?:code\.run|northflank\.app|northflank\.com)$/i.test(url.hostname)) return null;
    return base;
  } catch { return null; }
}

function secret(): string | null {
  const value = process.env.ELEVATE_LLM_SECRET?.trim();
  return value || null;
}

/**
 * Elevate self-hosted inference provider.
 *
 * Talks to the platform-owned vLLM worker (services/llm-gpu-worker) through
 * its OpenAI-compatible /v1/chat/completions endpoint. This is the fully
 * self-controlled inference path: no commercial provider is involved.
 *
 * Configuration comes from the canonical secret stores:
 *   ELEVATE_LLM_URL    — public URL of the GPU worker
 *   ELEVATE_LLM_SECRET — shared bearer token minted at provisioning time
 */
export class ElevateProvider implements AIProvider {
  readonly name = 'elevate' as const;

  isAvailable(): boolean {
    return Boolean(endpoint() && secret());
  }

  async *chatStream(options: ChatCompletionOptions): AsyncGenerator<string> {
    const base = endpoint();
    const token = secret();
    if (!base || !token) throw new Error('Elevate LLM worker not configured (ELEVATE_LLM_URL / ELEVATE_LLM_SECRET)');
    const response = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: SERVED_MODEL,
        messages: options.messages,
        temperature: options.temperature ?? 0.5,
        max_tokens: elevateCompletionBudget(options),
        stream: true,
        ...(requestsJson(options) ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(requestTimeoutMs())])
        : AbortSignal.timeout(requestTimeoutMs()),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Elevate LLM worker streaming request failed: HTTP ${response.status}`);
    }
    if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
      await response.body?.cancel();
      throw new Error('Elevate LLM worker did not return an event stream');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completed = false;
    let hasContent = false;
    try {
      while (!completed) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value, { stream: !chunk.done });
        if (buffer.length > 1_048_576) throw new Error('Elevate LLM stream event exceeds the size limit');
        let boundary: RegExpExecArray | null;
        while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
          const event = buffer.slice(0, boundary.index);
          buffer = buffer.slice(boundary.index + boundary[0].length);
          const data = event.split(/\r?\n/).filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).replace(/^ /, '')).join('\n');
          if (!data) continue;
          if (data === '[DONE]') { completed = true; break; }
          const payload = JSON.parse(data) as {
            error?: unknown;
            choices?: Array<{ delta?: { content?: string | null } }>;
          };
          if (payload.error) throw new Error('Elevate LLM worker reported a stream error');
          const content = payload.choices?.[0]?.delta?.content;
          if (typeof content === 'string' && content) { hasContent = true; yield content; }
        }
        if (chunk.done && !completed) throw new Error('Elevate LLM stream ended before completion');
      }
      if (!hasContent) throw new Error('Elevate LLM worker returned no text content');
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const base = endpoint();
    const token = secret();
    if (!base || !token) throw new Error('Elevate LLM worker not configured (ELEVATE_LLM_URL / ELEVATE_LLM_SECRET)');

    const response = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SERVED_MODEL,
        messages: options.messages,
        temperature: options.temperature ?? 0.5,
        max_tokens: elevateCompletionBudget(options),
        ...(requestsJson(options) ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: AbortSignal.timeout(requestTimeoutMs()),
    });

    const payload = (await response.json().catch(() => ({}))) as OpenAIChatResponse;
    if (!response.ok) {
      throw new Error(
        `Elevate LLM worker ${response.status}: ${payload.error?.message || 'request failed'}`.slice(0, 300),
      );
    }

    const content = payload.choices?.[0]?.message?.content ?? '';
    if (!String(content).trim()) throw new Error('Elevate LLM worker returned no text content');

    const promptTokens = payload.usage?.prompt_tokens ?? 0;
    const completionTokens = payload.usage?.completion_tokens ?? 0;

    return {
      content: normalizeStructuredOutput(String(content), options),
      model: payload.model || SERVED_MODEL,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: payload.usage?.total_tokens ?? promptTokens + completionTokens,
      },
    };
  }
}
