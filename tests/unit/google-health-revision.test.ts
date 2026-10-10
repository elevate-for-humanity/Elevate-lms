import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRuntimeReadiness } from '@/lib/health/service-health';
afterEach(() => vi.unstubAllEnvs());
describe('Google health revision identity', () => {
  it('reports the Cloud Run supplied revision independently of the build commit', () => {
    vi.stubEnv('K_REVISION', 'elevate-admin-migration-release-123');
    vi.stubEnv('GIT_SHA', 'a'.repeat(40));
    expect(getRuntimeReadiness()).toMatchObject({
      revision: 'elevate-admin-migration-release-123',
      commit: 'a'.repeat(40),
    });
  });
  it('does not fabricate a serving revision outside Cloud Run', () => {
    vi.stubEnv('K_REVISION', '');
    expect(getRuntimeReadiness().revision).toBeNull();
  });
});
