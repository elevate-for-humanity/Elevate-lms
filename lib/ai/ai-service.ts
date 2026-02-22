import { logger } from '@/lib/logger';
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
import { OpenAIProvider, GeminiProvider, AzureProvider, StabilityProvider } from './providers';

// -- Provider Registry --

const chatProviders: Record<string, () => AIProvider> = {
  openai: () => new OpenAIProvider(),
  gemini: () => new GeminiProvider(),
  azure: () => new AzureProvider(),
};

const imageProviders: Record<string, () => AIImageProvider> = {
  dalle: () => new OpenAIProvider(),
  azure: () => new AzureProvider(),
  stability: () => new StabilityProvider(),
};

// -- Singleton cache --

let _chatProvider: AIProvider | null = null;
let _imageProvider: AIImageProvider | null = null;

// -- Provider Resolution --

function resolveChatProvider(): AIProvider {
  if (_chatProvider) return _chatProvider;

  const preferred = (process.env.AI_PROVIDER || 'openai') as AIProviderName;

  // Try preferred first
  if (preferred !== 'none' && chatProviders[preferred]) {
    const provider = chatProviders[preferred]();
    if (provider.isAvailable()) {
      _chatProvider = provider;
      return provider;
    }
    logger.warn(`AI provider "${preferred}" not available, trying fallbacks`);
  }

  // Fallback chain: openai → gemini → azure
  for (const name of ['openai', 'gemini', 'azure']) {
    if (name === preferred) continue;
    const provider = chatProviders[name]();
    if (provider.isAvailable()) {
      logger.info(`AI: using fallback provider "${name}"`);
      _chatProvider = provider;
      return provider;
    }
  }

  throw new Error('No AI chat provider available. Set OPENAI_API_KEY, GEMINI_API_KEY, or AZURE_OPENAI_API_KEY.');
}

function resolveImageProvider(): AIImageProvider {
  if (_imageProvider) return _imageProvider;

  const preferred = (process.env.AI_IMAGE_PROVIDER || 'dalle') as AIImageProviderName;

  if (preferred !== 'none' && imageProviders[preferred]) {
    const provider = imageProviders[preferred]();
    if (provider.isAvailable()) {
      _imageProvider = provider;
      return provider;
    }
  }

  // Fallback: dalle → stability → azure
  for (const name of ['dalle', 'stability', 'azure']) {
    if (name === preferred) continue;
    const provider = imageProviders[name]();
    if (provider.isAvailable()) {
      _imageProvider = provider;
      return provider;
    }
  }

  throw new Error('No AI image provider available. Set OPENAI_API_KEY or STABILITY_API_KEY.');
}

// -- Public API --

/**
 * Send a chat completion request through the configured AI provider.
 * Provider is selected via AI_PROVIDER env var (default: openai).
 * Falls back automatically if the preferred provider is unavailable.
 */
export async function aiChat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const provider = resolveChatProvider();
  return provider.chat(options);
}

/**
 * Generate images through the configured AI image provider.
 * Provider is selected via AI_IMAGE_PROVIDER env var (default: dalle).
 */
export async function aiGenerateImage(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
  const provider = resolveImageProvider();
  return provider.generateImage(options);
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
    const cleaned = result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
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
    const cleaned = result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { score: 0, maxScore, feedback: 'Unable to grade automatically. Please contact your instructor.', passed: false };
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
 * Reset cached providers (useful for testing or config changes).
 */
export function resetProviders(): void {
  _chatProvider = null;
  _imageProvider = null;
}
