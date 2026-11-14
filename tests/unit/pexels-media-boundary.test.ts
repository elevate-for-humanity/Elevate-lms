import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPexelsImage, getPexelsVideoClip, getPollinationsImage } from '@/lib/video/pexels';

describe('Pexels media boundary', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('uses a non-empty deterministic fallback prompt for unknown domains', () => {
    expect(getPollinationsImage('unknown-domain')).toContain('professional%20learning%20education');
  });

  it('falls back safely when Pexels credentials are absent', async () => {
    vi.stubEnv('PEXELS_API_KEY', '');
    await expect(getPexelsImage('unknown-domain')).resolves.toContain('image.pollinations.ai');
    await expect(getPexelsVideoClip('instructional scene')).resolves.toBeNull();
  });
});
