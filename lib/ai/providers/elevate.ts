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
  return raw.replace(/\/+$/, '');
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
