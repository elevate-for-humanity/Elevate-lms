import { describe, expect, it } from 'vitest';
import { narrationPlaybackRate } from '@/components/voice/useNaturalVoice';

describe('platform narration pacing', () => {
  it('uses calm, consistent defaults for automatic voices', () => {
    expect(narrationPlaybackRate({ style: 'instructor' })).toBe(0.84);
    expect(narrationPlaybackRate({ style: 'assistant' })).toBe(0.88);
    expect(narrationPlaybackRate({ style: 'commercial' })).toBe(0.9);
  });

  it('prevents page-level narration from racing', () => {
    expect(narrationPlaybackRate({ style: 'instructor', rate: 1 })).toBe(0.92);
    expect(narrationPlaybackRate({ style: 'assistant', rate: 1.5 })).toBe(0.92);
  });

  it('respects a speed deliberately selected by the learner', () => {
    expect(
      narrationPlaybackRate({
        style: 'instructor',
        rate: 1.25,
        userControlledRate: true,
      }),
    ).toBe(1.25);
  });
});
