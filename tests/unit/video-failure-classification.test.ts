import { describe, expect, it } from 'vitest';
import { classifyVideoFailure } from '@/lib/video/job-queue';

describe('video failure classification', () => {
  it('treats governed narration authorization failures as terminal authorization errors', () => {
    expect(classifyVideoFailure('MEDIA_NARRATION_AUTHORIZATION_REQUIRED')).toBe('authorization');
  });

  it('keeps provider throttling retryable', () => {
    expect(classifyVideoFailure('Provider returned 429 rate limit')).toBe('transient');
  });
});
