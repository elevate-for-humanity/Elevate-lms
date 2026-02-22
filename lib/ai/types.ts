/**
 * AI Provider Abstraction Layer — Type Definitions
 *
 * All AI functionality routes through these interfaces.
 * Providers (OpenAI, Gemini, Azure, local models) implement them.
 * Consumers never import provider SDKs directly.
 */

// -- Chat / Completion --

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** If true, return a streaming response */
  stream?: boolean;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// -- Image Generation --

export interface ImageGenerationOptions {
  prompt: string;
  /** Image dimensions */
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  /** Number of images to generate */
  count?: number;
  /** Output format */
  format?: 'url' | 'b64_json';
  /** Style hint */
  style?: 'natural' | 'vivid';
}

export interface GeneratedImage {
  url?: string;
  b64Json?: string;
}

// -- Quiz Generation --

export interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'open_ended';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface QuizGenerationOptions {
  topic: string;
  /** Source content to base questions on */
  content?: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// -- Grading --

export interface GradingOptions {
  question: string;
  studentAnswer: string;
  correctAnswer?: string;
  rubric?: string;
  maxScore?: number;
}

export interface GradingResult {
  score: number;
  maxScore: number;
  feedback: string;
  passed: boolean;
}

// -- Provider Interface --

export interface AIProvider {
  readonly name: string;

  /** Chat completion (text generation) */
  chat(options: ChatCompletionOptions): Promise<ChatCompletionResult>;

  /** Check if this provider is configured and available */
  isAvailable(): boolean;
}

export interface AIImageProvider {
  readonly name: string;

  /** Generate images from a text prompt */
  generateImage(options: ImageGenerationOptions): Promise<GeneratedImage[]>;

  isAvailable(): boolean;
}

// -- Provider Registry --

export type AIProviderName = 'openai' | 'gemini' | 'azure' | 'local' | 'none';
export type AIImageProviderName = 'dalle' | 'stability' | 'local' | 'none';
