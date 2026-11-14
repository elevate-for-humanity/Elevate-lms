import { describe, expect, it } from 'vitest';

import { adaptiveBackoffMs } from '@/lib/resilience/adaptive-backoff';

describe('adaptiveBackoffMs', () => {
  it('grows exponentially and resets when the caller returns to failure one', () => {
    const options = { baseDelayMs: 15_000, maxDelayMs: 900_000, jitterRatio: 0 };
    expect(adaptiveBackoffMs(1, options)).toBe(15_000);
    expect(adaptiveBackoffMs(2, options)).toBe(30_000);
    expect(adaptiveBackoffMs(3, options)).toBe(60_000);
    expect(adaptiveBackoffMs(1, options)).toBe(15_000);
  });

  it('never exceeds the configured ceiling, including jitter', () => {
    expect(adaptiveBackoffMs(20, {
      baseDelayMs: 30_000,
      maxDelayMs: 900_000,
      jitterRatio: 0.2,
    }, () => 1)).toBe(900_000);
  });
});
