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
import {
  OpenAIProvider,
  AnthropicProvider,
  GeminiProvider,
  AzureProvider,
  StabilityProvider,
  GroqProvider,
} from './providers';

// -- Provider Registry --

const chatProviders: Record<string, () => AIProvider> = {
  openai: () => new OpenAIProvider(),
  anthropic: () => new AnthropicProvider(),
  gemini: () => new GeminiProvider(),
  azure: () => new AzureProvider(),
  groq: () => new GroqProvider(),
};

const imageProviders: Record<string, () => AIImageProvider> = {
  dalle: () => new OpenAIProvider(),
  azure: () => new AzureProvider(),
  stability: () => new StabilityProvider(),
};

function resolveChatProvider(): AIProvider {
  const preferred = (process.env.AI_PROVIDER || 'openai') as AIProviderName;

  if (preferred !== 'none' && chatProviders[preferred]) {
    const provider = chatProviders[preferred]();
    if (provider.isAvailable()) return provider;
    logger.warn(`AI provider "${preferred}" not available, trying fallbacks`);
  }

  // Claude is now a first-class fallback for reasoning-heavy staff workflows.
  for (const name of ['openai', 'anthropic', 'gemini', 'groq', 'azure']) {
    if (name === preferred) continue;
    const provider = chatProviders[name]();
    if (provider.isAvailable()) {
      logger.info(`AI: using fallback provider "${name}"`);
      return provider;
    }
  }

  throw new Error(
    'No AI chat provider available. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, GROQ_API_KEY, or AZURE_OPENAI_API_KEY.',
  );
}

function resolveImageProvider(): AIImageProvider {
  const preferred = (process.env.AI_IMAGE_PROVIDER || 'dalle') as AIImageProviderName;

  if (preferred !== 'none' && imageProviders[preferred]) {
    const provider = imageProviders[preferred]();
    if (provider.isAvailable()) return provider;
  }

  for (const name of ['dalle', 'stability', 'azure']) {
    if (name === preferred) continue;
    const provider = imageProviders[name]();
    if (provider.isAvailable()) return provider;
  }

  throw new Error('No AI image provider available. Set OPENAI_API_KEY or STABILITY_API_KEY.');
}

export async function aiChat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  let provider: AIProvider;
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
    label: `aiChat:${provider.name}`,
    shouldRetry: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      return !msg.includes('401') && !msg.includes('400') && !msg.includes('content_policy');
    },
  });
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

export function getActiveProviderName(): string {
  try {
    return resolveChatProvider().name;
  } catch {
    return 'none';
  }
}

export function isAIAvailable(): boolean {
  try {
    resolveChatProvider();
    return true;
  } catch {
    return false;
  }
}

export function resetProviders(): void {
  // intentional no-op
}

// ── Reasoning model ───────────────────────────────────────────────────────────

function preferredReasoningProvider(): 'anthropic' | 'azure' | 'default' {
  const configured = process.env.AI_REASONING_PROVIDER?.trim().toLowerCase();
  if (configured === 'anthropic' || configured === 'claude') return 'anthropic';
  if (configured === 'azure') return 'azure';
  if (new AnthropicProvider().isAvailable()) return 'anthropic';
  if (new AzureProvider().isAvailable()) return 'azure';
  return 'default';
}

/**
 * Advanced reasoning route. Claude is preferred when configured because the
 * Admin workflows use it for document analysis, compliance narratives, complex
 * data questions, and agent planning. Azure reasoning remains supported.
 */
export async function aiReason(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const preferred = preferredReasoningProvider();

  if (preferred === 'anthropic') {
    const provider = new AnthropicProvider();
    try {
      return await withResilience(
        () => provider.chat({ ...options, provider: 'anthropic' }),
        {
          circuitBreaker: breakers.openai,
          attempts: 2,
          baseDelayMs: 1500,
          label: 'aiReason:anthropic',
          shouldRetry: (err) => {
            const msg = err instanceof Error ? err.message : String(err);
            return !msg.includes('401') && !msg.includes('400');
          },
        },
      );
    } catch (error) {
      logger.warn('[aiReason] Claude reasoning failed, trying Azure/default fallback', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (preferred === 'azure' || new AzureProvider().isAvailable()) {
    const provider = new AzureProvider();
    if (provider.isAvailable()) {
      try {
        return await withResilience(() => provider.reason(options), {
          circuitBreaker: breakers.openai,
          attempts: 2,
          baseDelayMs: 2000,
          label: 'aiReason:azure',
          shouldRetry: (err) => {
            const msg = err instanceof Error ? err.message : String(err);
            return !msg.includes('401') && !msg.includes('400');
          },
        });
      } catch (error) {
        logger.warn('[aiReason] Azure reasoning failed, falling back to standard AI', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return aiChat(options);
}

export function isReasoningAvailable(): boolean {
  return new AnthropicProvider().isAvailable() || new AzureProvider().isAvailable() || isAIAvailable();
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
  | { type: 'tool_call'; name: string; args: Record<string, unknown>; callId?: string };

/**
 * Stream or emit tool-call events using the active provider. OpenAI and Claude
 * both support real function/tool selection; other providers fall back to text.
 */
export async function* aiChatWithTools(options: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  tools: ToolDefinition[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): AsyncIterable<ToolStreamEvent> {
  const provider = resolveChatProvider();

  if (provider.name === 'openai' && provider.isAvailable()) {
    const openaiProvider = provider as OpenAIProvider;
    yield* openaiProvider.chatStreamWithTools(options);
    return;
  }

  if (provider.name === 'anthropic' && provider.isAvailable()) {
    const anthropicProvider = provider as AnthropicProvider;
    yield* anthropicProvider.chatWithTools(options);
    return;
  }

  for await (const delta of aiChatStream({
    model: options.model,
    messages: options.messages,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
  })) {
    yield { type: 'delta', content: delta };
  }
}
