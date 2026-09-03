/**
 * AI Service — Public API
 *
 * Usage:
 *   import { aiChat, aiGenerateImage, aiGenerateQuiz, aiGradeAnswer } from '@/lib/ai';
 *
 * Provider selection via env vars:
 *   AI_PROVIDER=openai|gemini|azure     (default: openai)
 *   AI_IMAGE_PROVIDER=dalle|stability|azure  (default: dalle)
 *
 * Falls back automatically if preferred provider is unavailable.
 */

export {
  aiChat,
  aiGenerateImage,
  aiGenerateQuiz,
  aiGradeAnswer,
  getActiveProviderName,
  isAIAvailable,
  resetProviders,
} from './ai-service';

export type {
  AIProvider,
  AIImageProvider,
  AIProviderName,
  AIImageProviderName,
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
  ImageGenerationOptions,
  GeneratedImage,
  QuizQuestion,
  QuizGenerationOptions,
  GradingOptions,
  GradingResult,
} from './types';
