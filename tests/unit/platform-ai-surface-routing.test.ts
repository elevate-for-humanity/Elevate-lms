import { describe, expect, it } from 'vitest';
import {
  PLATFORM_SURFACES,
  getPlatformSurface,
  getPlatformSurfaceByPath,
} from '@/lib/platform/orchestration/surfaces';
import { PlatformFeature } from '@/lib/platform/features';

describe('unified Admin AI surfaces', () => {
  it('keeps every persona key and its independent feature permission', () => {
    const entries = [
      ['ai_paris', PlatformFeature.AI_PARIS],
      ['ai_ellie', PlatformFeature.AI_ELLIE],
      ['ai_lizzy', PlatformFeature.AI_LIZZY],
      ['ai_zora', PlatformFeature.AI_ZORA],
    ] as const;

    for (const [key, requiredFeature] of entries) {
      const surface = getPlatformSurface(key);
      expect(surface).toMatchObject({
        key,
        entryPath: '/ai-team',
        runtime: 'admin',
        scope: 'organization',
        requiredFeature,
      });
    }

    expect(Object.keys(PLATFORM_SURFACES).filter((key) => key.startsWith('ai_'))).toHaveLength(4);
  });

  it('resolves unified AI navigation without selecting a different persona runtime', () => {
    expect(getPlatformSurfaceByPath('admin', '/ai-team')?.key).toBe('ai_paris');
    expect(getPlatformSurfaceByPath('admin', '/ai-team/history')?.key).toBe('ai_paris');
    expect(getPlatformSurfaceByPath('lms', '/ai-team')).toBeNull();
    expect(getPlatformSurfaceByPath('admin', '/ai/ellie')).toBeNull();
  });
});
