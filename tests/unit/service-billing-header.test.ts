import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({
  auth: vi.fn(),
  rows: [] as any[],
  billingError: false,
  filters: [] as any[],
}));
const database = {
  from(table: string) {
    const filters: Record<string, unknown> = {};
    const q: any = {
      select: () => q,
      in: () => q,
      not: () => q,
      lt: () => q,
      order: () => q,
      limit: () => q,
      eq: (key: string, value: unknown) => {
        filters[key] = value;
        return q;
      },
      maybeSingle: async () => ({ data: { first_name: 'Elizabeth' } }),
      then: (resolve: any) => {
        if (table === 'notifications') {
          state.filters.push(filters);
          const data = state.rows.filter(
            (r) =>
              r.user_id === filters.user_id &&
              r.read === filters.read &&
              r.metadata.source === filters['metadata->>source'],
          );
          return Promise.resolve({
            data,
            count: data.length,
            error: state.billingError ? { message: 'unavailable' } : null,
          }).then(resolve);
        }
        return Promise.resolve({ count: 2, data: [] }).then(resolve);
      },
    };
    return q;
  },
};
vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: state.auth }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/supabase/admin', () => ({ getAdminClient: async () => database }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => database }));
import { GET } from '@/apps/admin/app/api/admin/header-data/route';
beforeEach(() => {
  state.auth.mockResolvedValue({ user: { id: 'elizabeth-admin' } });
  state.rows = [];
  state.filters = [];
  state.billingError = false;
});
it('includes only the current administrator unread billing warnings alongside operational entries', async () => {
  state.rows = [
    {
      id: 'critical',
      user_id: 'elizabeth-admin',
      read: false,
      title: 'Twilio: balance critical',
      metadata: { source: 'service-billing' },
    },
    {
      id: 'other-admin',
      user_id: 'someone-else',
      read: false,
      title: 'Private account',
      metadata: { source: 'service-billing' },
    },
    {
      id: 'paid',
      user_id: 'elizabeth-admin',
      read: true,
      title: 'Paid old invoice',
      metadata: { source: 'service-billing' },
    },
  ];
  const response = await GET(
    new NextRequest('https://admin.elevateforhumanity.org/api/admin/header-data'),
  );
  const body = await response.json();
  expect(body.notifs[0]).toMatchObject({
    id: 'service-billing:critical',
    unread: true,
    href: '/operations/infrastructure-costs#service-billing',
  });
  expect(body.notifs.some((n: any) => n.id === 'apps')).toBe(true);
  expect(JSON.stringify(body)).not.toContain('Private account');
  expect(JSON.stringify(body)).not.toContain('Paid old invoice');
  expect(state.filters[0].user_id).toBe('elizabeth-admin');
});
it('marks billing data unavailable without claiming all notification sources succeeded', async () => {
  state.billingError = true;
  const response = await GET(
    new NextRequest('https://admin.elevateforhumanity.org/api/admin/header-data'),
  );
  expect(await response.json()).toMatchObject({
    status: 'degraded',
    unavailableSources: ['service-billing'],
  });
});
