import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Real route entry point with a mocked authenticated learner and database.
// Missing or invalid program identity must fail before any shop lookup/insert.
const fixture = vi.hoisted(() => ({ queried: [] as string[] }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'learner-id', email: 'learner@example.org' } } }) },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: (table: string) => {
      fixture.queried.push(table);
      const q: any = {};
      for (const method of ['select', 'eq', 'neq', 'in', 'is']) q[method] = () => q;
      q.maybeSingle = async () => ({
        data: table === 'profiles' ? { role: 'student', full_name: 'Learner' } : null,
        error: null,
      });
      return q;
    },
  }),
}));
import { POST } from '@/apps/lms/app/api/host-shop/match-requests/route';

async function submit(body: Record<string, unknown>) {
  return POST(new NextRequest('https://app.elevateforhumanity.org/api/host-shop/match-requests', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ host_shop_id: 'shop-1', ...body }),
  }));
}

describe('no implicit apprenticeship rerouting in match requests', () => {
  beforeEach(() => { fixture.queried = []; });

  it('rejects a missing program rather than silently creating a barber request', async () => {
    const response = await submit({});
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/Valid apprenticeship program required/);
    expect(fixture.queried).not.toContain('shops');
    expect(fixture.queried).not.toContain('host_shop_match_requests');
  });

  it('rejects generic salon classification and malformed filter syntax', async () => {
    for (const invalid of ['salon', 'esthetician),status.eq.approved']) {
      fixture.queried = [];
      expect((await submit({ program_slug: invalid })).status).toBe(400);
      expect(fixture.queried).not.toContain('shops');
    }
  });

  it('accepts the explicit nail apprenticeship slug for further approved-shop validation', async () => {
    const response = await submit({ program_slug: 'nail-technician-apprenticeship' });
    expect(response.status).toBe(404); // Mock has no approved active shop.
    expect(fixture.queried).toContain('shops');
    expect(fixture.queried).not.toContain('host_shop_match_requests');
  });
});
