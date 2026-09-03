/**
 * AI Model Router for Dev Studio
 * Routes requests to appropriate AI models based on task type
 * 
 * Strategy:
 * - Gemini: Free/low-cost course generation, quick tasks
 * - DeepSeek: Bulk generation, code completion
 * - OpenAI/Claude: Advanced reasoning, large refactors, security-critical tasks
 */

export type ModelProvider = 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'qwen';

export interface ModelConfig {
  provider: ModelProvider;
  modelName: string;
  temperature: number;
  maxTokens: number;
  costPer1kTokens: number; // USD
  strengths: string[];
  weaknesses: string[];
}

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // OpenAI Models
  'openai-gpt-4o': {
    provider: 'openai',
    modelName: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 128000,
    costPer1kTokens: 0.015,
    strengths: ['Advanced reasoning', 'Code generation', 'Large context', 'Function calling'],
    weaknesses: ['Higher cost', 'Rate limits'],
  },
  'openai-gpt-4o-mini': {
    provider: 'openai',
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 128000,
    costPer1kTokens: 0.00075,
    strengths: ['Fast', 'Cost-effective', 'Good reasoning'],
    weaknesses: ['Less capable than GPT-4o'],
  },
  'openai-o1-preview': {
    provider: 'openai',
    modelName: 'o1-preview',
    temperature: 1.0,
    maxTokens: 128000,
    costPer1kTokens: 0.06,
    strengths: ['Complex reasoning', 'Chain-of-thought', 'Advanced problem solving'],
    weaknesses: ['Slower', 'No function calling', 'Higher cost'],
  },

  // Anthropic Models
  'anthropic-claude-3-5-sonnet': {
    provider: 'anthropic',
    modelName: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 200000,
    costPer1kTokens: 0.003,
    strengths: ['Long context', 'Code', 'Reasoning', 'Safety'],
    weaknesses: ['Higher latency'],
  },
  'anthropic-claude-3-opus': {
    provider: 'anthropic',
    modelName: 'claude-3-opus-20240229',
    temperature: 0.7,
    maxTokens: 200000,
    costPer1kTokens: 0.015,
    strengths: ['Best reasoning', 'Complex tasks', 'Analysis'],
    weaknesses: ['Higher cost', 'Slower'],
  },
  'anthropic-claude-3-haiku': {
    provider: 'anthropic',
    modelName: 'claude-3-haiku-20240307',
    temperature: 0.7,
    maxTokens: 200000,
    costPer1kTokens: 0.00025,
    strengths: ['Fast', 'Very cheap', 'Good for simple tasks'],
    weaknesses: ['Less reasoning capability'],
  },

  // Google Gemini Models
  'gemini-1-5-pro': {
    provider: 'gemini',
    modelName: 'gemini-1.5-pro',
    temperature: 0.7,
    maxTokens: 2000000,
    costPer1kTokens: 0.0, // Free tier available
    strengths: ['Massive context', 'Free tier', 'Multimodal', 'Fast'],
    weaknesses: ['Occasional inconsistencies'],
  },
  'gemini-1-5-flash': {
    provider: 'gemini',
    modelName: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 1000000,
    costPer1kTokens: 0.0, // Free tier
    strengths: ['Fastest', 'Free', 'Good for bulk tasks'],
    weaknesses: ['Less reasoning depth'],
  },
  'gemini-2-0-flash-exp': {
    provider: 'gemini',
    modelName: 'gemini-2.0-flash-exp',
    temperature: 0.7,
    maxTokens: 1000000,
    costPer1kTokens: 0.0,
    strengths: ['Latest model', 'Fast', 'Free'],
    weaknesses: ['Newer, less tested'],
  },

  // DeepSeek Models
  'deepseek-chat': {
    provider: 'deepseek',
    modelName: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 128000,
    costPer1kTokens: 0.00014,
    strengths: ['Very cheap', 'Good code', 'Large context'],
    weaknesses: ['Less safety training'],
  },
  'deepseek-coder': {
    provider: 'deepseek',
    modelName: 'deepseek-coder',
    temperature: 0.7,
    maxTokens: 128000,
    costPer1kTokens: 0.00014,
    strengths: ['Specialized code', 'Very cheap'],
    weaknesses: ['Less general reasoning'],
  },

  // Qwen/OpenRouter Models
  'qwen-2-5-72b': {
    provider: 'qwen',
    modelName: 'qwen-2.5-72b-instruct',
    temperature: 0.7,
    maxTokens: 32000,
    costPer1kTokens: 0.0005,
    strengths: ['Good value', 'Multilingual'],
    weaknesses: ['Smaller context'],
  },
  'qwen-coder': {
    provider: 'qwen',
    modelName: 'qwq-32b-preview',
    temperature: 0.7,
    maxTokens: 32000,
    costPer1kTokens: 0.0005,
    strengths: ['Code specialized', 'Reasoning'],
    weaknesses: ['Less mature'],
  },
};

// Task type to model mapping
export type TaskType = 
  | 'course_generation'
  | 'bulk_generation'
  | 'code_completion'
  | 'complex_refactor'
  | 'security_review'
  | 'documentation'
  | 'quick_task'
  | 'reasoning'
  | 'general';

export const TASK_MODEL_MAP: Record<TaskType, string[]> = {
  course_generation: ['gemini-1-5-flash', 'deepseek-chat', 'gemini-1-5-pro'], // Prefer free/fast
  bulk_generation: ['deepseek-chat', 'deepseek-coder', 'qwen-2-5-72b'], // Prefer cheap
  code_completion: ['deepseek-coder', 'openai-gpt-4o-mini', 'anthropic-claude-3-haiku'],
  complex_refactor: ['openai-o1-preview', 'anthropic-claude-3-opus', 'openai-gpt-4o'],
  security_review: ['anthropic-claude-3-5-sonnet', 'openai-o1-preview'], // Best reasoning
  documentation: ['gemini-1-5-flash', 'qwen-2-5-72b', 'anthropic-claude-3-haiku'],
  quick_task: ['gemini-1-5-flash', 'anthropic-claude-3-haiku', 'openai-gpt-4o-mini'],
  reasoning: ['openai-o1-preview', 'anthropic-claude-3-opus', 'openai-gpt-4o'],
  general: ['anthropic-claude-3-5-sonnet', 'openai-gpt-4o', 'gemini-1-5-pro'],
};

export interface RouterConfig {
  preferredProvider?: ModelProvider;
  budgetLimit?: number;
  latencyTarget?: 'fast' | 'balanced' | 'quality';
  enableFallback?: boolean;
}

export class ModelRouter {
  private config: RouterConfig;
  private availableModels: Set<string>;

  constructor(config: RouterConfig = {}) {
    this.config = config;
    this.availableModels = new Set(Object.keys(MODEL_CONFIGS));
  }

  /**
   * Get the best model for a task based on configuration
   */
  selectModel(taskType: TaskType): ModelConfig {
    const modelKeys = TASK_MODEL_MAP[taskType] || TASK_MODEL_MAP.general;
    
    // Filter by preferred provider if set
    let candidates = modelKeys;
    if (this.config.preferredProvider) {
      const preferred = modelKeys.filter(key => 
        MODEL_CONFIGS[key]?.provider === this.config.preferredProvider
      );
      if (preferred.length > 0) {
        candidates = preferred;
      }
    }

    // Select based on latency target
    if (this.config.latencyTarget === 'fast') {
      candidates = candidates.filter(key => 
        ['gemini-1-5-flash', 'anthropic-claude-3-haiku', 'openai-gpt-4o-mini'].includes(key)
      );
    } else if (this.config.latencyTarget === 'quality') {
      candidates = candidates.filter(key =>
        ['openai-o1-preview', 'anthropic-claude-3-opus', 'openai-gpt-4o'].includes(key)
      );
    }

    // Return first available model
    const selectedKey = candidates[0];
    return MODEL_CONFIGS[selectedKey] || MODEL_CONFIGS['gemini-1-5-flash'];
  }

  /**
   * Get model by key
   */
  getModel(key: string): ModelConfig | undefined {
    return MODEL_CONFIGS[key];
  }

  /**
   * Get all available models
   */
  getAllModels(): ModelConfig[] {
    return Object.values(MODEL_CONFIGS);
  }

  /**
   * Estimate cost for a task
   */
  estimateCost(taskType: TaskType, inputTokens: number, outputTokens: number): number {
    const model = this.selectModel(taskType);
    const inputCost = (inputTokens / 1000) * model.costPer1kTokens;
    const outputCost = (outputTokens / 1000) * model.costPer1kTokens;
    return inputCost + outputCost;
  }

  /**
   * Check if task requires approval
   */
  requiresApproval(taskType: TaskType): boolean {
    return ['security_review', 'complex_refactor'].includes(taskType);
  }
}

// Singleton instance
export const modelRouter = new ModelRouter();

// Helper to get API key for provider (server-side only)
export function getModelApiKey(provider: ModelProvider): string | undefined {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'gemini':
      return process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    case 'deepseek':
      return process.env.DEEPSEEK_API_KEY;
    case 'qwen':
      return process.env.OPENROUTER_API_KEY; // Qwen via OpenRouter
    default:
      return undefined;
  }
}

// Helper to call a model
export async function callModel(
  config: ModelConfig,
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = getModelApiKey(config.provider);
  if (!apiKey) {
    throw new Error(`API key not configured for ${config.provider}`);
  }

  const temperature = options?.temperature ?? config.temperature;
  const maxTokens = options?.maxTokens ?? config.maxTokens;

  switch (config.provider) {
    case 'openai':
      return callOpenAI(apiKey, config.modelName, messages, temperature, maxTokens);
    case 'anthropic':
      return callAnthropic(apiKey, config.modelName, messages, temperature, maxTokens);
    case 'gemini':
      return callGemini(apiKey, config.modelName, messages, temperature, maxTokens);
    case 'deepseek':
      return callDeepSeek(apiKey, config.modelName, messages, temperature, maxTokens);
    case 'qwen':
      return callOpenRouter(apiKey, config.modelName, messages, temperature, maxTokens);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

async function callOpenAI(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callAnthropic(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number
): Promise<string> {
  // Convert messages format for Anthropic
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: conversationMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      system: systemMessage?.content,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}

async function callGemini(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find(m => m.role === 'system')?.content;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callDeepSeek(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || '',
      'X-Title': 'Elevate Dev Studio',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}