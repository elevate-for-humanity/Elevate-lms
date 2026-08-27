import { logger } from '@/lib/logger';
import { withResilience, breakers, CircuitBreaker, CircuitOpenError } from '@/lib/resilience';
import type {
  AIProvider,
  AIImageProvider,
  AIProviderName,
  AIImageProviderName,
  ChatCompletionOptions,
  ChatCompletionResult,
  ImageGenerationOptions,
  GeneratedImage,
  QuizGenerationOptions,
  QuizQuestion,
  GradingOptions,
  GradingResult,
} from './types';
import {
  ElevateProvider,
  OpenAIProvider,
  AnthropicProvider,
  GeminiProvider,
  GoogleProvider,
  CloudflareProvider,
  AzureProvider,
  StabilityProvider,
  GroqProvider,
} from './providers';

const chatProviders: Record<string, () => AIProvider> = {
  elevate: () => new ElevateProvider(),
  gemini: () => new GeminiProvider(),
  google: () => new GoogleProvider(),
  groq: () => new GroqProvider(),
  cloudflare: () => new CloudflareProvider(),
  openai: () => new OpenAIProvider(),
  anthropic: () => new AnthropicProvider(),
  azure: () => new AzureProvider(),
};

const imageProviders: Record<string, () => AIImageProvider> = {
  dalle: () => new OpenAIProvider(),
  azure: () => new AzureProvider(),
  stability: () => new StabilityProvider(),
};

// Provider precedence is fully configurable via AI_PROVIDER_ORDER
// (comma-separated). The default is self-hosted/free-first: the platform-owned
// GPU worker leads when configured, then Cloudflare Workers AI and the other
// low-cost paths, with OpenAI last and optional.
const DEFAULT_CHAT_PROVIDER_ORDER = ['elevate', 'cloudflare', 'groq', 'gemini', 'google', 'anthropic', 'azure', 'openai'];

function chatProviderOrder(): string[] {
  const configured = process.env.AI_PROVIDER_ORDER?.trim();
  if (!configured) return DEFAULT_CHAT_PROVIDER_ORDER;
  const names = configured
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name && name !== 'none' && Boolean(chatProviders[name]));
  const deduped = names.filter((name, index) => names.indexOf(name) === index);
  // Append any providers not explicitly listed so an override can never
  // silently remove a working fallback path.
  for (const name of DEFAULT_CHAT_PROVIDER_ORDER) {
    if (!deduped.includes(name)) deduped.push(name);
  }
  return deduped;
}
const CIRCUIT_RECOVERY_WAIT_MS = 31_000;
const disabledChatProviders = new Set<string>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTerminalProviderError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes('401') ||
    message.includes('invalid_api_key') ||
    message.includes('invalid api key') ||
    message.includes('no credits remaining') ||
    message.includes('insufficient_quota') ||
    message.includes('billing hard limit')
  );
}

function disableProviderForProcess(providerName: string, error: unknown): void {
  disabledChatProviders.add(providerName);
  logger.warn(`[aiChat] provider "${providerName}" quarantined for this process after terminal credential/billing failure`, {
    error: error instanceof Error ? error.message : String(error),
  });
}

function configuredDefaultProvider(): string {
  const configured = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (configured) return configured;
  // No explicit preference: lead with the first provider in the configured
  // order (self-hosted first by default).
  return chatProviderOrder()[0] ?? 'elevate';
}

function resolveChatProvider(): AIProvider {
  const preferred = configuredDefaultProvider() as AIProviderName;

  if (preferred !== 'none' && chatProviders[preferred] && !disabledChatProviders.has(preferred)) {
    const createProvider = chatProviders[preferred];
    if (!createProvider) throw new Error(`Unknown AI chat provider: ${preferred}`);
    const provider = createProvider();
    if (provider.isAvailable()) return provider;
    logger.warn(`AI provider "${preferred}" not available, trying fallbacks`);
  }

  for (const name of chatProviderOrder()) {
    if (name === preferred || disabledChatProviders.has(name)) continue;
    const createProvider = chatProviders[name];
    if (!createProvider) continue;
    const provider = createProvider();
    if (provider.isAvailable()) {
      logger.info(`AI: using fallback provider "${name}"`);
      return provider;
    }
  }

  throw new Error(
    'No AI chat provider available. Configure the Elevate LLM worker (ELEVATE_LLM_URL/ELEVATE_LLM_SECRET), Cloudflare Workers AI credentials, GROQ_API_KEY, GEMINI_API_KEY, GOOGLE_CLOUD_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or AZURE_OPENAI_API_KEY.',
  );
}

function resolveChatCandidates(options: ChatCompletionOptions): AIProvider[] {
  const explicit = options.provider && options.provider !== 'none' && chatProviders[options.provider]
    ? String(options.provider)
    : null;
  const preferred = explicit || configuredDefaultProvider();
  const names = [preferred, ...chatProviderOrder()].filter(
    (name, index, list) =>
      name !== 'none' &&
      Boolean(chatProviders[name]) &&
      !disabledChatProviders.has(name) &&
      list.indexOf(name) === index,
  );

  return names
    .map((name) => chatProviders[name])
    .filter((createProvider): createProvider is () => AIProvider => Boolean(createProvider))
    .map((createProvider) => createProvider())
    .filter((provider) => provider.isAvailable());
}

function resolveImageProvider(): AIImageProvider {
  const preferred = (process.env.AI_IMAGE_PROVIDER || 'dalle') as AIImageProviderName;
  if (preferred !== 'none' && imageProviders[preferred]) {
    const createProvider = imageProviders[preferred];
    if (!createProvider) throw new Error(`Unknown AI image provider: ${preferred}`);
    const provider = createProvider();
    if (provider.isAvailable()) return provider;
  }

  for (const name of ['dalle', 'stability', 'azure']) {
    if (name === preferred) continue;
    const createProvider = imageProviders[name];
    if (!createProvider) continue;
    const provider = createProvider();
    if (provider.isAvailable()) return provider;
  }

  throw new Error('No AI image provider available. Set OPENAI_API_KEY or STABILITY_API_KEY.');
}

export async function aiChat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  let providers = resolveChatCandidates(options);
  if (!providers.length) {
    throw new Error('No AI chat provider available in the configured free-first or paid provider pools.');
  }

  let lastError: unknown;
  const allowCircuitRecoveryWait = process.env.AI_CIRCUIT_RECOVERY_WAIT === '1';
  const passes = allowCircuitRecoveryWait ? 2 : 1;

  for (let pass = 0; pass < passes; pass += 1) {
    for (const provider of providers) {
      if (disabledChatProviders.has(provider.name)) continue;
      try {
        const providerOptions = { ...options, provider: provider.name as AIProviderName };
        const result = await withResilience(() => provider.chat(providerOptions), {
          circuitBreaker: CircuitBreaker.for(`ai:${provider.name}`, {
            failureThreshold: 5,
            resetTimeoutMs: 30_000,
          }),
          attempts: 2,
          baseDelayMs: 1000,
          label: `aiChat:${provider.name}`,
          shouldRetry: (err) => {
            const msg = err instanceof Error ? err.message : String(err);
            return !msg.includes('401') && !msg.includes('400') && !msg.includes('content_policy');
          },
        });
        return { ...result, provider: provider.name };
      } catch (error) {
        lastError = error;
        if (isTerminalProviderError(error)) disableProviderForProcess(provider.name, error);
        logger.warn(`[aiChat] provider "${provider.name}" failed; trying next configured provider`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (pass === 0 && allowCircuitRecoveryWait && lastError instanceof CircuitOpenError) {
      logger.warn('[aiChat] configured provider attempts ended with an open circuit; waiting for provider recovery window', {
        waitMs: CIRCUIT_RECOVERY_WAIT_MS,
      });
      await sleep(CIRCUIT_RECOVERY_WAIT_MS);
      providers = resolveChatCandidates(options);
      continue;
    }
    break;
  }

  throw lastError instanceof Error ? lastError : new Error('All configured AI chat providers failed');
}

export async function* aiChatStream(options: ChatCompletionOptions): AsyncIterable<string> {
  const provider = resolveChatProvider();
  if ('chatStream' in provider && typeof (provider as { chatStream?: unknown }).chatStream === 'function') {
    const streamProvider = provider as { chatStream: (opts: ChatCompletionOptions) => AsyncIterable<string> };
    yield* streamProvider.chatStream(options);
  } else {
    const result = await provider.chat(options);
    if (result.content) yield result.content;
  }
}

export async function aiGenerateImage(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
  const provider = resolveImageProvider();
  return withResilience(() => provider.generateImage(options), {
    circuitBreaker: breakers.openai,
    attempts: 2,
    baseDelayMs: 2000,
    label: 'aiGenerateImage',
  });
}

export async function aiGenerateQuiz(options: QuizGenerationOptions): Promise<QuizQuestion[]> {
  const count = options.count || 5;
  const difficulty = options.difficulty || 'medium';
  const prompt = options.content
    ? `Based on the following content, generate ${count} ${difficulty}-difficulty quiz questions.\n\nContent:\n${options.content}`
    : `Generate ${count} ${difficulty}-difficulty quiz questions about: ${options.topic}`;

  const result = await aiChat({
    messages: [
      {
        role: 'system',
        content: `You are a quiz generator for workforce training courses. Generate quiz questions in JSON format.
Each question must have: question, type (multiple_choice|true_false|open_ended), options (array for multiple_choice), correctAnswer, explanation.
Return ONLY a JSON array, no markdown fences.`,
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    maxTokens: 4096,
  });

  try {
    const cleaned = result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    logger.error('Failed to parse quiz generation response');
    return [];
  }
}

export async function aiGradeAnswer(options: GradingOptions): Promise<GradingResult> {
  const maxScore = options.maxScore || 100;
  const result = await aiChat({
    messages: [
      {
        role: 'system',
        content: `You are a fair, encouraging grading assistant for workforce training courses.
Grade the student's answer and return JSON: { "score": number, "maxScore": ${maxScore}, "feedback": "string", "passed": boolean }
Passing threshold is 80%. Be specific in feedback. Return ONLY JSON.`,
      },
      {
        role: 'user',
        content: `Question: ${options.question}\n\nStudent Answer: ${options.studentAnswer}${
          options.correctAnswer ? `\n\nCorrect Answer: ${options.correctAnswer}` : ''
        }${options.rubric ? `\n\nRubric: ${options.rubric}` : ''}`,
      },
    ],
    temperature: 0.3,
    maxTokens: 1024,
  });

  try {
    const cleaned = result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { score: 0, maxScore, feedback: 'Unable to grade automatically. Please contact your instructor.', passed: false };
  }
}

export function getActiveProviderName(): string {
  try { return resolveChatProvider().name; } catch { return 'none'; }
}

export function isAIAvailable(): boolean {
  try { resolveChatProvider(); return true; } catch { return false; }
}

export function resetProviders(): void {
  disabledChatProviders.clear();
}

function preferredReasoningProvider(): 'anthropic' | 'azure' | 'default' {
  const configured = process.env.AI_REASONING_PROVIDER?.trim().toLowerCase();
  if (configured === 'anthropic' || configured === 'claude') return 'anthropic';
  if (configured === 'azure') return 'azure';
  if (new AnthropicProvider().isAvailable()) return 'anthropic';
  if (new AzureProvider().isAvailable()) return 'azure';
  return 'default';
}

export async function aiReason(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const preferred = preferredReasoningProvider();
  if (preferred === 'anthropic') {
    const provider = new AnthropicProvider();
    try {
      const result = await withResilience(() => provider.chat({ ...options, provider: 'anthropic' }), {
        circuitBreaker: CircuitBreaker.for('ai:anthropic', { failureThreshold: 5, resetTimeoutMs: 30_000 }),
        attempts: 2,
        baseDelayMs: 1500,
        label: 'aiReason:anthropic',
        shouldRetry: (err) => {
          const msg = err instanceof Error ? err.message : String(err);
          return !msg.includes('401') && !msg.includes('400');
        },
      });
      return { ...result, provider: provider.name };
    } catch (error) {
      logger.warn('[aiReason] Claude reasoning failed; trying fallback', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (preferred === 'azure' || new AzureProvider().isAvailable()) {
    const provider = new AzureProvider();
    if (provider.isAvailable()) {
      try {
        const result = await withResilience(() => provider.reason(options), {
          circuitBreaker: CircuitBreaker.for('ai:azure', { failureThreshold: 5, resetTimeoutMs: 30_000 }),
          attempts: 2,
          baseDelayMs: 2000,
          label: 'aiReason:azure',
          shouldRetry: (err) => {
            const msg = err instanceof Error ? err.message : String(err);
            return !msg.includes('401') && !msg.includes('400');
          },
        });
        return { ...result, provider: provider.name };
      } catch (error) {
        logger.warn('[aiReason] Azure reasoning failed; falling back to standard AI', { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }
  return aiChat(options);
}

export function isReasoningAvailable(): boolean {
  return new AnthropicProvider().isAvailable() || new AzureProvider().isAvailable() || isAIAvailable();
}

export type ToolDefinition = {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

export type ToolStreamEvent =
  | { type: 'delta'; content: string }
  | { type: 'tool_call'; name: string; args: Record<string, unknown>; callId?: string };

export async function* aiChatWithTools(options: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  tools: ToolDefinition[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): AsyncIterable<ToolStreamEvent> {
  const provider = resolveChatProvider();
  if (provider.name === 'openai' && provider.isAvailable()) {
    yield* (provider as OpenAIProvider).chatStreamWithTools(options);
    return;
  }
  if (provider.name === 'anthropic' && provider.isAvailable()) {
    yield* (provider as AnthropicProvider).chatWithTools(options);
    return;
  }
  for await (const delta of aiChatStream({
    ...(options.model ? { model: options.model } : {}),
    messages: options.messages,
    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
    ...(options.maxTokens !== undefined ? { maxTokens: options.maxTokens } : {}),
  })) {
    yield { type: 'delta', content: delta };
  }
}
