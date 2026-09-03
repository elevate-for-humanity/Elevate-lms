import { describe, expect, it } from 'vitest';
import { CircuitOpenError } from '@/lib/resilience';
import { isAiDegradedError } from '@/lib/ai/degraded';

describe('isAiDegradedError', () => {
  it('treats circuit open as degraded', () => {
    expect(isAiDegradedError(new CircuitOpenError('openai', 30_000))).toBe(true);
  });

  it('treats missing providers as degraded', () => {
    expect(isAiDegradedError(new Error('No AI chat provider available.'))).toBe(true);
    expect(isAiDegradedError(new Error('All AI chat providers failed'))).toBe(true);
  });

  it('does not treat auth errors as degraded', () => {
    expect(isAiDegradedError(new Error('401 Unauthorized'))).toBe(false);
  });
});
