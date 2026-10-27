import { describe, expect, it, vi } from 'vitest';
import { resolveReleaseActor } from '@/lib/ultimate-course-builder/worker/release-actor';

function database(creator: string | null, role = 'admin', roleError: unknown = null) {
  return { from: vi.fn((table: string) => ({ select: () => ({ eq: () => ({
    single: async () => table === 'courses'
      ? { data: { created_by: creator }, error: null }
      : { data: { id: 'build-admin', role }, error: roleError },
  }) }) })) };
}
describe('imported course release actor', () => {
  it('preserves the existing creator path', async () => {
    const db = database('creator');
    expect(await resolveReleaseActor(db as any, 'course', 'build-admin')).toBe('creator');
    expect(db.from).toHaveBeenCalledTimes(1);
  });
  it.each(['admin', 'super_admin'])('uses a verified %s for an imported course', async role => {
    const db = database(null, role);
    expect(await resolveReleaseActor(db as any, 'course', 'build-admin')).toBe('build-admin');
    expect(db.from).toHaveBeenCalledWith('profiles');
  });
  it('rejects a non-administrator fallback', async () => {
    await expect(resolveReleaseActor(database(null, 'student') as any, 'course', 'build-admin'))
      .rejects.toThrow('ULTIMATE_RELEASE_ADMINISTRATOR_REQUIRED');
  });
  it('requires an identified administrator', async () => {
    await expect(resolveReleaseActor(database(null) as any, 'course'))
      .rejects.toThrow('ULTIMATE_RELEASE_ACTOR_REQUIRED');
  });
  it('does not suppress a failed role lookup', async () => {
    const error = new Error('role lookup unavailable');
    await expect(resolveReleaseActor(database(null, 'admin', error) as any, 'course', 'build-admin'))
      .rejects.toBe(error);
  });
});
