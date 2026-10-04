// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { db } = vi.hoisted(() => ({ db: { from: vi.fn() } }));

vi.mock('@/lib/with-auth', () => ({ withAuth: (handler: any) => (request: any) => handler(request, { id: 'test-admin' }) }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, handler: any) => handler }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/safe', () => ({ toErrorMessage: (error: any) => error.message }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => db }));
vi.mock('@/lib/course-builder/licensed-media', () => ({ attachStoredLicensedMedia: vi.fn(), recommendLicensedMediaForCourse: vi.fn() }));
vi.mock('@/lib/course-builder/orchestrator', () => ({ queueCourseMedia: vi.fn() }));
vi.mock('@/lib/course-builder/envato-workspace', () => ({ upsertEnvatoWorkspaceManifest: vi.fn() }));
vi.mock('@/lib/ultimate-course-builder/worker/resume-media-dependency', () => ({ resumeMediaDependency: vi.fn() }));

import { GET, POST } from '@/apps/admin/app/api/admin/integrations/envato/route';
import { attachStoredLicensedMedia } from '@/lib/course-builder/licensed-media';
import { resumeMediaDependency } from '@/lib/ultimate-course-builder/worker/resume-media-dependency';
import { queueCourseMedia } from '@/lib/course-builder/orchestrator';

describe('Envato unlimited subscription boundary', () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  it('does not claim subscription access from a Market token or invoke the Market API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const response = await GET(new NextRequest('https://admin.example/api/admin/integrations/envato'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ provider: 'Envato subscription', marketEnabled: false, subscriptionVerified: false, connected: false, accessModel: 'subscription-licensed-library' });
    expect(body.browserUrl).toBe('/studio/browser?provider=envato&signin=1');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it.each(['purchases', 'download'])('disconnects Market %s without a provider request', async (action) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const response = await GET(new NextRequest('https://admin.example/api/admin/integrations/envato?action=' + action));
    expect(response.status).toBe(410);
    expect((await response.json()).error).toBe('ENVATO_MARKET_DISABLED_USE_SUBSCRIPTION_WORKSPACE');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('disconnects Market purchase synchronization without fetching or storing purchases', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const response = await POST(new NextRequest('https://admin.example/api/admin/integrations/envato', { method: 'POST', body: JSON.stringify({ action: 'sync', courseId: 'test-course' }) }));
    expect(response.status).toBe(410);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it.each([{ jobs: [] }, { jobs: [{ id: 'ultimate-job' }] }])('keeps attached licensed footage in the Ultimate pipeline: %j', async ({ jobs }) => {
    const query: any = {
      select: () => query,
      eq: () => query,
      maybeSingle: async () => ({ data: { id: 'course', org_id: 'org' }, error: null }),
    };
    db.from.mockReset().mockReturnValue(query);
    vi.mocked(attachStoredLicensedMedia).mockResolvedValue({ id: 'source-asset' } as any);
    vi.mocked(resumeMediaDependency).mockResolvedValue(jobs);
    vi.mocked(queueCourseMedia).mockClear();
    const response = await POST(new NextRequest('https://admin.example/api/admin/integrations/envato', {
      method: 'POST', body: JSON.stringify({ action: 'attach', matchId: 'match', courseId: 'course', lessonId: 'lesson' }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true, ultimateJobs: jobs, buildResumeStatus: jobs.length ? 'queued' : 'not_queued',
    });
    expect(resumeMediaDependency).toHaveBeenCalledWith(db, 'course', ['lesson']);
    expect(queueCourseMedia).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalledWith('course_lessons');
  });
});
