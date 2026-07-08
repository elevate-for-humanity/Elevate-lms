import { logger } from '@/lib/logger';
import { withResilience, breakers } from '@/lib/resilience';
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
import { OpenAIProvider, GeminiProvider, AzureProvider, StabilityProvider, GroqProvider } from './providers';
// AzureProvider re-exported for reasoning resolver below

// -- Provider Registry --

const chatProviders: Record<string, () => AIProvider> = {
  openai: () => new OpenAIProvider(),
  gemini: () => new GeminiProvider(),
  azure: () => new AzureProvider(),
  groq: () => new GroqProvider(),
};

const imageProviders: Record<string, () => AIImageProvider> = {
  dalle: () => new OpenAIProvider(),
  azure: () => new AzureProvider(),
  stability: () => new StabilityProvider(),
};

// -- Provider Resolution --
// No singleton cache — process.env may be hydrated from the DB mid-request
// (via hydrateProcessEnv), so we resolve fresh each call. Provider instances
// are cheap to construct; the real cost is the network call, not instantiation.

function resolveChatProvider(): AIProvider {
  const preferred = (process.env.AI_PROVIDER || 'openai') as AIProviderName;

  // Try preferred first
  if (preferred !== 'none' && chatProviders[preferred]) {
    const provider = chatProviders[preferred]();
    if (provider.isAvailable()) return provider;
    logger.warn(`AI provider "${preferred}" not available, trying fallbacks`);
  }

  // Fallback chain: openai → gemini → groq → azure
  for (const name of ['openai', 'gemini', 'groq', 'azure']) {
    if (name === preferred) continue;
    const provider = chatProviders[name]();
    if (provider.isAvailable()) {
      logger.info(`AI: using fallback provider "${name}"`);
      return provider;
    }
  }

  throw new Error(
    'No AI chat provider available. Set OPENAI_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, or AZURE_OPENAI_API_KEY.',
  );
}

function resolveImageProvider(): AIImageProvider {
  const preferred = (process.env.AI_IMAGE_PROVIDER || 'dalle') as AIImageProviderName;

  if (preferred !== 'none' && imageProviders[preferred]) {
    const provider = imageProviders[preferred]();
    if (provider.isAvailable()) return provider;
  }

  // Fallback: dalle → stability → azure
  for (const name of ['dalle', 'stability', 'azure']) {
    if (name === preferred) continue;
    const provider = imageProviders[name]();
    if (provider.isAvailable()) return provider;
  }

  throw new Error('No AI image provider available. Set OPENAI_API_KEY or STABILITY_API_KEY.');
}

// -- Public API --

/**
 * Send a chat completion request through the configured AI provider.
 * Provider is selected via options.provider, then AI_PROVIDER env var (default: openai).
 * Falls back automatically if the preferred provider is unavailable.
 */
export async function aiChat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  let provider;
  if (options.provider && options.provider !== 'none' && chatProviders[options.provider]) {
    const explicit = chatProviders[options.provider]();
    provider = explicit.isAvailable() ? explicit : resolveChatProvider();
  } else {
    provider = resolveChatProvider();
  }
  return withResilience(() => provider.chat(options), {
    circuitBreaker: breakers.openai,
    attempts: 2,
    baseDelayMs: 1000,
    label: 'aiChat',
    shouldRetry: (err) => {
      // Don't retry on auth errors or content policy violations
      const msg = err instanceof Error ? err.message : String(err);
      return !msg.includes('401') && !msg.includes('400') && !msg.includes('content_policy');
    },
  });
}

/**
 * Stream a chat completion as an async iterable of content deltas.
 * Only works with OpenAI provider. Falls back to a single-chunk iterable
 * if the provider doesn't support streaming or no key is configured.
 */
export async function* aiChatStream(options: ChatCompletionOptions): AsyncIterable<string> {
  const provider = resolveChatProvider();
  if ('chatStream' in provider && typeof (provider as { chatStream?: unknown }).chatStream === 'function') {
    const streamProvider = provider as { chatStream: (opts: ChatCompletionOptions) => AsyncIterable<string> };
    yield* streamProvider.chatStream(options);
  } else {
    // Provider doesn't support streaming — fall back to a single chunk
    const result = await provider.chat(options);
    if (result.content) yield result.content;
  }
}

/**
 * Generate images through the configured AI image provider.
 * Provider is selected via AI_IMAGE_PROVIDER env var (default: dalle).
 */
export async function aiGenerateImage(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
  const provider = resolveImageProvider();
  return withResilience(() => provider.generateImage(options), {
    circuitBreaker: breakers.openai,
    attempts: 2,
    baseDelayMs: 2000,
    label: 'aiGenerateImage',
  });
}

/**
 * Generate quiz questions from a topic or content.
 * Uses the chat provider with a structured prompt.
 */
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
    const cleaned = result.content
      .replace(/```json?\n?/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    logger.error('Failed to parse quiz generation response');
    return [];
  }
}

/**
 * Grade a student's answer using AI.
 * Uses the chat provider with a grading rubric prompt.
 */
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
    const cleaned = result.content
      .replace(/```json?\n?/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      score: 0,
      maxScore,
      feedback: 'Unable to grade automatically. Please contact your instructor.',
      passed: false,
    };
  }
}

/**
 * Get the name of the currently active chat provider.
 */
export function getActiveProviderName(): string {
  try {
    return resolveChatProvider().name;
  } catch {
    return 'none';
  }
}

/**
 * Check if any AI provider is available.
 */
export function isAIAvailable(): boolean {
  try {
    resolveChatProvider();
    return true;
  } catch {
    return false;
  }
}

/**
 * No-op kept for API compatibility. Provider resolution no longer caches,
 * so there is nothing to reset.
 */
export function resetProviders(): void {
  // intentional no-op
}

// ── Reasoning model ───────────────────────────────────────────────────────────

function resolveReasoningProvider(): AzureProvider {
  const p = new AzureProvider();
  if (!p.isAvailable()) {
    throw new Error(
      'No reasoning provider available. Set AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_API_KEY + AZURE_REASONING_DEPLOYMENT.',
    );
  }
  return p;
}

/**
 * Send a request to the Azure reasoning model (o3-mini by default).
 *
 * Use for tasks that benefit from deep multi-step reasoning:
 *   - Course generation from complex syllabi
 *   - Quiz generation with nuanced distractors
 *   - Funding eligibility analysis
 *   - Document field extraction with ambiguous content
 *   - Compliance gap analysis
 *
 * Falls back to aiChat() if Azure reasoning is not configured.
 */
export async function aiReason(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  try {
    const provider = resolveReasoningProvider();
    return await withResilience(() => provider.reason(options), {
      circuitBreaker: breakers.openai,
      attempts: 2,
      baseDelayMs: 2000,
      label: 'aiReason',
      shouldRetry: (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        return !msg.includes('401') && !msg.includes('400');
      },
    });
  } catch {
    // Graceful fallback to standard chat if reasoning model not configured
    logger.warn('[aiReason] Reasoning provider unavailable, falling back to aiChat');
    return aiChat(options);
  }
}

/**
 * Check if the Azure reasoning model is configured and available.
 */
export function isReasoningAvailable(): boolean {
  try {
    resolveReasoningProvider();
    return true;
  } catch {
    return false;
  }
}

// ─── Tool-calling stream ──────────────────────────────────────────────────────

export type ToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolStreamEvent =
  | { type: 'delta'; content: string }
  | { type: 'tool_call'; name: string; args: Record<string, unknown> };

/**
 * Stream a chat completion with OpenAI function calling.
 * Yields ToolStreamEvent — either text deltas or tool_call events.
 * Falls back to plain text stream if OpenAI is unavailable.
 */
export async function* aiChatWithTools(options: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  tools: ToolDefinition[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): AsyncIterable<ToolStreamEvent> {
  const provider = resolveChatProvider();

  // Only OpenAI supports tool calling — check if it's the active provider
  if (provider.name !== 'openai' || !provider.isAvailable()) {
    // Fallback: plain stream, no tool calls
    for await (const delta of aiChatStream({
      model: options.model ?? 'gpt-4.1-mini',
      messages: options.messages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    })) {
      yield { type: 'delta', content: delta };
    }
    return;
  }

  // Use OpenAI provider's underlying client via chatStream with tools
  const openaiProvider = provider as OpenAIProvider;
  yield* openaiProvider.chatStreamWithTools(options);
}
