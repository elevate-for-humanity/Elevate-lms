// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ guard: vi.fn(), publish: vi.fn(), database: vi.fn(), status: vi.fn() }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireRoles: mocks.guard }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.database }));
vi.mock('@/lib/admin/publish-website', () => ({ publishAndUpdateWebsite: mocks.publish, getPublishWebsiteStatus: mocks.status }));

import { GET, POST } from '@/apps/admin/app/api/admin/publish-website/route';

beforeEach(() => vi.clearAllMocks());

describe('production publishing authorization', () => {
  it.each([401, 403])('does not read status or dispatch production work for a rejected session (%s)', async status => {
    mocks.guard.mockResolvedValue({ error: new Response(null, { status }) });
    for (const handler of [GET, POST]) {
      const req = new NextRequest('https://admin.elevateforhumanity.org/api/admin/publish-website', {
        method: 'POST', body: JSON.stringify({ confirm: 'PUBLISH' }),
      });
      expect((await handler(req)).status).toBe(status);
      expect(mocks.guard).toHaveBeenLastCalledWith(req, ['admin', 'super_admin']);
    }
    expect(mocks.publish).not.toHaveBeenCalled();
    expect(mocks.status).not.toHaveBeenCalled();
    expect(mocks.database).not.toHaveBeenCalled();
  });
});
