import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
const publish = vi.hoisted(() => vi.fn());
vi.mock('@/lib/ultimate-course-builder/release/release-service', () => ({
  UltimateReleaseService: class { publish = publish; },
}));
import { releaseCanonicalCourse } from '@/lib/ultimate-course-builder/release/release-course';
function database(data: unknown, error: unknown = null) {
  const query = { select: () => query, eq: () => query, in: () => query, order: () => query,
    limit: () => query, maybeSingle: async () => ({ data, error }) };
  return { from: () => query } as unknown as SupabaseClient;
}
describe('publication has one verified production authority', () => {
  it('does not publish an old draft without a release-ready Ultimate build', async () => {
    publish.mockClear();
    await expect(releaseCanonicalCourse(database(null), 'course', 'actor')).rejects.toThrow('ULTIMATE_BUILD_NOT_RELEASE_READY');
    expect(publish).not.toHaveBeenCalled();
  });
  it('uses the verified release service for an eligible saved build', async () => {
    publish.mockResolvedValue({ version: 2 });
    expect(await releaseCanonicalCourse(database({ id: 'built-id' }), 'course', 'actor')).toMatchObject({ ok: true, authority: 'ultimate-course-builder' });
    expect(publish).toHaveBeenCalledWith('built-id', 'actor');
  });
});
