import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({ media: vi.fn(), contract: vi.fn(), publish: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/course-factory/media-manager', () => ({ getCourseMediaState: calls.media }));
vi.mock('@/lib/course-factory/canonical-course-gate', () => ({ evaluatePersistedCredentialCourse: calls.contract }));
vi.mock('@/lib/course-builder/persisted-publish-service', () => ({ publishPersistedCourseWithClient: calls.publish }));
import { finalizeUnifiedCourseBuildWithClient } from '@/lib/course-builder/build-lifecycle';

function database() {
  const chain: any = {};
  for (const name of ['select', 'eq', 'order', 'update', 'neq', 'upsert']) {
    chain[name] = vi.fn(() => chain);
  }
  chain.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);
  return { from: vi.fn(() => chain) } as any;
}

describe('automatic publication at render completion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.media.mockResolvedValue({ completePackage: true });
    calls.contract.mockResolvedValue({ pass: true, findings: [] });
    calls.publish.mockResolvedValue({ ok: true, state: 'published' });
  });

  it('publishes immediately after complete media and contract verification', async () => {
    const db = database();
    const result = await finalizeUnifiedCourseBuildWithClient({ db, courseId: 'course' });
    expect(result.state).toBe('published');
    expect(calls.publish).toHaveBeenCalledWith(expect.objectContaining({ db, courseId: 'course', actorId: null }));
    expect(calls.media).toHaveBeenCalledWith('course', { verifyUrls: true });
  });

  it('does not publish unfinished media', async () => {
    calls.media.mockResolvedValue({ completePackage: false });
    const result = await finalizeUnifiedCourseBuildWithClient({ db: database(), courseId: 'course' });
    expect(result.state).toBe('media_pending');
    expect(calls.publish).not.toHaveBeenCalled();
  });

  it('does not publish a course that fails the completed build contract', async () => {
    calls.contract.mockResolvedValue({ pass: false, findings: [{ gate: 'assessment' }] });
    const result = await finalizeUnifiedCourseBuildWithClient({ db: database(), courseId: 'course' });
    expect(result.ok).toBe(false);
    expect(calls.publish).not.toHaveBeenCalled();
  });
});
