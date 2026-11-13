import { describe, expect, it } from 'vitest';
import { classifyVideoFailure } from '@/lib/video/job-queue';

describe('video failure classification', () => {
  it('treats governed narration authorization failures as terminal authorization errors', () => {
    expect(classifyVideoFailure('MEDIA_NARRATION_AUTHORIZATION_REQUIRED')).toBe('authorization');
  });

  it('keeps provider throttling retryable', () => {
    expect(classifyVideoFailure('Provider returned 429 rate limit')).toBe('transient');
  });
  it.each([401, 403])('treats private checkpoint HTTP %s as terminal authorization', (status) => {
    expect(classifyVideoFailure(`PRIVATE_CHECKPOINT_READ_HTTP_${status}`)).toBe('authorization');
    expect(classifyVideoFailure(`PRIVATE_CHECKPOINT_WRITE_HTTP_${status}`)).toBe('authorization');
  });
  it('treats storage credential rejections as terminal authorization errors', () => {
    expect(classifyVideoFailure('Storage upload failed: 403 Forbidden')).toBe('authorization');
    expect(classifyVideoFailure('B2 bucket AccessDenied')).toBe('authorization');
    expect(classifyVideoFailure('Storage upload failed: 413 Request Entity Too Large')).toBe('storage');
    expect(
      classifyVideoFailure('Upload failed for generated-lessons/lesson-a1b2c3d4-4031-4403-9403-abcdef123456.mp4: 503'),
    ).toBe('storage');
  });
});
