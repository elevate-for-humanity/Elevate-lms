import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { mediaMatchTerms, scoreLicensedMediaMatch } from '@/lib/course-builder/licensed-media';
import { XAIProvider } from '@/lib/ai/providers/xai';

describe('licensed media course matching', () => {
  it('removes generic stock-video words and keeps distinct course topics', () => {
    expect(
      mediaMatchTerms('The course lesson: Barber clipper safety and clipper guards video'),
    ).toEqual(['barber', 'clipper', 'safety', 'guards']);
  });

  it('scores course-specific purchased scenes above unrelated footage', () => {
    const relevant = scoreLicensedMediaMatch(
      'Demonstrate clipper guards and barber sanitation procedures',
      'Barber using clipper guards safely',
    );
    const unrelated = scoreLicensedMediaMatch(
      'Demonstrate clipper guards and barber sanitation procedures',
      'Aerial city traffic at night',
    );
    expect(relevant.score).toBeGreaterThan(unrelated.score);
    expect(relevant.reasons).toEqual(
      expect.arrayContaining(['Shared topic: barber', 'Shared topic: clipper']),
    );
  });
});

describe('Grok / xAI provider registration', () => {
  const originalKey = process.env.XAI_API_KEY;
  const originalGrokKey = process.env.GROK_API_KEY;
  afterEach(() => {
    if (originalKey === undefined) delete process.env.XAI_API_KEY;
    else process.env.XAI_API_KEY = originalKey;
    if (originalGrokKey === undefined) delete process.env.GROK_API_KEY;
    else process.env.GROK_API_KEY = originalGrokKey;
  });

  it('requires the server-side XAI_API_KEY and identifies itself as xai', () => {
    delete process.env.XAI_API_KEY;
    expect(new XAIProvider().isAvailable()).toBe(false);
    process.env.XAI_API_KEY = 'xai-test-key-long-enough';
    const provider = new XAIProvider();
    expect(provider.name).toBe('xai');
    expect(provider.isAvailable()).toBe(true);
  });

  it('recognizes an existing key saved under the Grok admin alias', () => {
    delete process.env.XAI_API_KEY;
    process.env.GROK_API_KEY = 'grok-test-key-long-enough';
    expect(new XAIProvider().isAvailable()).toBe(true);
  });
});
