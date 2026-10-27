import { afterEach, describe, expect, it, vi } from 'vitest';

import { elevateCompletionBudget } from '@/lib/ai/providers/elevate';

describe('Elevate provider completion budget', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('clamps an 8000-token request below the default model context limit', () => {
    const budget = elevateCompletionBudget({
      messages: [{ role: 'user', content: 'Create a final assessment.' }],
      maxTokens: 8000,
    });

    expect(budget).toBeLessThan(8000);
    expect(budget).toBeLessThan(8192);
  });

  it('accounts for larger prompts and a configured context window', () => {
    vi.stubEnv('ELEVATE_LLM_CONTEXT_TOKENS', '4096');
    const budget = elevateCompletionBudget({
      messages: [{ role: 'user', content: 'x'.repeat(3000) }],
      maxTokens: 8000,
    });

    expect(budget).toBe(2572);
  });

  it('rejects prompts that leave no safe completion capacity', () => {
    vi.stubEnv('ELEVATE_LLM_CONTEXT_TOKENS', '2048');

    expect(() => elevateCompletionBudget({
      messages: [{ role: 'user', content: 'x'.repeat(4500) }],
      maxTokens: 8000,
    })).toThrow('prompt is too large');
  });
});
