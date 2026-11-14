// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ guard: vi.fn(), database: vi.fn() }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireRoles: mocks.guard }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.database }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, handler: unknown) => handler }));
vi.mock('@/lib/db/courses', () => ({ createEnrollment: vi.fn() }));
vi.mock('@/lib/email-course-notifications', () => ({ sendCourseEnrollmentEmail: vi.fn() }));

import { GET, POST } from '@/apps/admin/app/api/admin/enrollments/route';

beforeEach(() => vi.clearAllMocks());

describe('administrator enrollment access', () => {
  it.each([401, 403])('retains authorization status %s without opening the database', async (status) => {
    mocks.guard.mockResolvedValue({ error: new Response(null, { status }) });
    for (const handler of [GET, POST]) {
      const request = new Request('https://admin.elevateforhumanity.org/api/admin/enrollments');
      expect((await handler(request)).status).toBe(status);
      expect(mocks.guard).toHaveBeenLastCalledWith(request, ['admin', 'super_admin']);
    }
    expect(mocks.database).not.toHaveBeenCalled();
  });

  it('serves an authorized administrator an empty enrollment collection', async () => {
    mocks.guard.mockResolvedValue({ effectiveRoles: ['super_admin'] });
    mocks.database.mockResolvedValue({ from: () => {
      const query: any = { select: () => query, order: async () => ({ data: [], error: null }) };
      return query;
    } });
    const result = await GET(new Request('https://admin.elevateforhumanity.org/api/admin/enrollments'));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ data: [] });
  });
});
