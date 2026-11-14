import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@remotion/bundler', () => ({
  bundle: vi.fn(async () => '/tmp/remotion-test-bundle'),
}));

import {
  _getRemotionBundleRefCountForTests,
  _resetRemotionBundleCacheForTests,
  releaseRemotionBundle,
  retainRemotionBundle,
} from '@/lib/video/remotion-bundle-cache';

describe('remotion-bundle-cache', () => {
  beforeEach(() => {
    _resetRemotionBundleCacheForTests();
    vi.clearAllMocks();
  });

  it('keeps bundle until all holders release', async () => {
    await retainRemotionBundle();
    await retainRemotionBundle();
    expect(_getRemotionBundleRefCountForTests()).toBe(2);

    await releaseRemotionBundle();
    expect(_getRemotionBundleRefCountForTests()).toBe(1);
  });
});
