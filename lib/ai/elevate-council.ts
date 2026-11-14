import type { ChatMessage } from './types';
import { aiChat, getActiveProviderName, isAIAvailable } from './ai-service';

export type ElevateCouncilProvider = 'openai' | 'anthropic' | 'gemini' | 'groq';

export interface ElevateCouncilContribution {
  provider: ElevateCouncilProvider;
  role: string;
  model: string;
  content: string;
}

export interface ElevateCouncilResult {
  content: string;
  provider: string;
  model: string;
  contributors: ElevateCouncilProvider[];
  contributions: ElevateCouncilContribution[];
  degraded: boolean;
}

/**
 * Compatibility status for the former multi-model council UI.
 *
 * Only the canonical configured provider is reported active. Keeping this
 * shape avoids breaking existing admin clients while preventing parallel model
 * execution.
 */
export function getElevateCouncilAvailability(): Record<ElevateCouncilProvider, boolean> {
  const active = getActiveProviderName();
  return {
    openai: active === 'openai',
    anthropic: active === 'anthropic',
    gemini: active === 'gemini' || active === 'google',
    groq: active === 'groq',
  };
}

/**
 * The council is now a reasoning mode on the single AI authority. It performs
 * architecture, risk, implementation, and verification checks in one request
 * instead of asking several providers for duplicate answers and synthesizing
 * them through another model.
 */
export async function runElevateCouncil(options: {
  messages: ChatMessage[];
  systemPrompt: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<ElevateCouncilResult> {
  if (!isAIAvailable()) {
    throw new Error('The canonical Elevate AI provider is not configured.');
  }

  const result = await aiChat({
    messages: [
      {
        role: 'system',
        content: [
          options.systemPrompt,
          '',
          'Act as Elevate\'s production review authority.',
          'Internally check implementation compatibility, architecture and security risks, system interactions, operational dependencies, and verification requirements.',
          'Return one concise evidence-bound answer. Resolve tradeoffs explicitly.',
          'Never invent successful tests, deployments, credentials, repository changes, or live-state observations.',
          'Do not reveal private chain-of-thought.',
        ].join('\n'),
      },
      ...options.messages,
    ],
    temperature: options.temperature ?? 0.2,
    maxTokens: Math.min(Math.max(options.maxTokens ?? 1800, 512), 4096),
  });

  return {
    content: result.content,
    provider: result.provider || getActiveProviderName(),
    model: result.model,
    contributors: [],
    contributions: [],
    degraded: false,
  };
}
