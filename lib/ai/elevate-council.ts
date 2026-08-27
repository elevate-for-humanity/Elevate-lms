import { logger } from '@/lib/logger';
import type { AIProvider, ChatMessage } from './types';
import {
  AnthropicProvider,
  GeminiProvider,
  GroqProvider,
  OpenAIProvider,
} from './providers';

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

type ProviderEntry = {
  name: ElevateCouncilProvider;
  role: string;
  instruction: string;
  create: () => AIProvider;
};

const PROVIDERS: ProviderEntry[] = [
  {
    name: 'openai',
    role: 'implementation integrator',
    instruction:
      'Focus on executable implementation, interface compatibility, concrete code paths, and a concise final recommendation.',
    create: () => new OpenAIProvider(),
  },
  {
    name: 'anthropic',
    role: 'critical architecture reviewer',
    instruction:
      'Stress-test assumptions, find hidden failure modes, security gaps, data-integrity risks, and unsafe implementation shortcuts.',
    create: () => new AnthropicProvider(),
  },
  {
    name: 'gemini',
    role: 'systems cross-checker',
    instruction:
      'Check system interactions, edge cases, operational dependencies, deployment behavior, and whether the proposed solution is complete end to end.',
    create: () => new GeminiProvider(),
  },
  {
    name: 'groq',
    role: 'rapid diagnostics reviewer',
    instruction:
      'Prioritize fast fault isolation, reproducible diagnostics, minimal-risk fixes, and verification steps with evidence.',
    create: () => new GroqProvider(),
  },
];

function firstOrThrow<T>(items: T[], message: string): T {
  const first = items[0];
  if (first === undefined) throw new Error(message);
  return first;
}

function getAvailableProviders(): Array<ProviderEntry & { provider: AIProvider }> {
  return PROVIDERS.flatMap((entry) => {
    const provider = entry.create();
    return provider.isAvailable() ? [{ ...entry, provider }] : [];
  });
}

function councilPrompt(systemPrompt: string, entry: ProviderEntry): string {
  return [
    systemPrompt,
    '',
    'You are one reviewer inside the Elevate AI Council.',
    `Council responsibility: ${entry.role}.`,
    entry.instruction,
    'Return your independent recommendation. Do not claim a check, tool call, deployment, test, or file change happened unless it is explicitly present in the supplied evidence.',
    'Do not expose private chain-of-thought. Give concise conclusions, risks, and verifiable next actions only.',
  ].join('\n');
}

function synthesisPrompt(contributions: ElevateCouncilContribution[]): string {
  const evidence = contributions
    .map(
      (item) =>
        `## ${item.provider} — ${item.role}\nModel: ${item.model}\n${item.content}`,
    )
    .join('\n\n');

  return [
    'You are the final Elevate AI Council integrator.',
    'Synthesize the independent reviews below into one production-grade answer.',
    'Resolve disagreements explicitly. Prefer claims supported by supplied evidence. Never invent successful tests, deployments, credentials, repository changes, or live-state observations.',
    'Keep concrete implementation details, blockers, and verification requirements. Do not reveal chain-of-thought.',
    '',
    evidence,
  ].join('\n');
}

export function getElevateCouncilAvailability(): Record<ElevateCouncilProvider, boolean> {
  const available = new Set(getAvailableProviders().map((entry) => entry.name));
  return {
    openai: available.has('openai'),
    anthropic: available.has('anthropic'),
    gemini: available.has('gemini'),
    groq: available.has('groq'),
  };
}

export async function runElevateCouncil(options: {
  messages: ChatMessage[];
  systemPrompt: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<ElevateCouncilResult> {
  const active = getAvailableProviders();
  if (active.length === 0) {
    throw new Error(
      'No Elevate AI Council provider is configured. Configure at least one supported AI provider.',
    );
  }

  const maxTokens = Math.min(Math.max(options.maxTokens ?? 1800, 512), 4096);
  const temperature = options.temperature ?? 0.2;

  const settled = await Promise.allSettled(
    active.map(async (entry): Promise<ElevateCouncilContribution> => {
      const result = await entry.provider.chat({
        messages: [
          { role: 'system', content: councilPrompt(options.systemPrompt, entry) },
          ...options.messages,
        ],
        temperature,
        maxTokens,
      });

      return {
        provider: entry.name,
        role: entry.role,
        model: result.model,
        content: result.content,
      };
    }),
  );

  const contributions = settled.flatMap((result, index) => {
    if (result.status === 'fulfilled' && result.value.content.trim()) {
      return [result.value];
    }

    if (result.status === 'rejected') {
      logger.warn('[elevate-council] provider review failed', {
        provider: active[index]?.name,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
    return [];
  });

  if (contributions.length === 0) {
    throw new Error('All configured Elevate AI Council providers failed to return a review.');
  }

  if (contributions.length === 1) {
    const only = firstOrThrow(
      contributions,
      'Elevate AI Council contribution disappeared before response construction.',
    );
    return {
      content: only.content,
      provider: only.provider,
      model: only.model,
      contributors: [only.provider],
      contributions,
      degraded: active.length > 1,
    };
  }

  const synthesisProvider =
    active.find((entry) => entry.name === 'openai') ??
    firstOrThrow(active, 'Elevate AI Council provider disappeared before synthesis.');
  try {
    const synthesis = await synthesisProvider.provider.chat({
      messages: [
        {
          role: 'system',
          content:
            'Produce the final evidence-bound Elevate AI Council answer. Do not expose private chain-of-thought.',
        },
        { role: 'user', content: synthesisPrompt(contributions) },
      ],
      temperature: 0.1,
      maxTokens: Math.min(maxTokens + 800, 4096),
    });

    return {
      content: synthesis.content,
      provider: `${synthesisProvider.name}:council-synthesis`,
      model: synthesis.model,
      contributors: contributions.map((item) => item.provider),
      contributions,
      degraded: contributions.length < active.length,
    };
  } catch (error) {
    logger.warn('[elevate-council] synthesis failed; returning strongest available review', {
      provider: synthesisProvider.name,
      error: error instanceof Error ? error.message : String(error),
    });

    const fallback = firstOrThrow(
      contributions,
      'Elevate AI Council contribution disappeared before fallback.',
    );
    return {
      content: fallback.content,
      provider: `${fallback.provider}:council-fallback`,
      model: fallback.model,
      contributors: contributions.map((item) => item.provider),
      contributions,
      degraded: true,
    };
  }
}
