// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ failingTable: '', configured: true }));
const db = { from(table: string) {
  const result = () => ({ error: state.failingTable === table ? { code: '42P01' } : null,
    data: [], count: 0 });
  const query = {
    select: () => query, eq: () => query, gte: () => query, is: () => query, order: () => query, limit: () => query,
    maybeSingle: async () => ({ ...result(), data: table === 'profiles' ? { role: 'admin' } : null }),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve),
  };
  return query;
} };
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => db }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'admin' } } }) } }) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/integrations/runtime-status', () => ({ RUNTIME_INTEGRATIONS: [{ id: 'quickbooks', webhook: true }], runtimeConfiguration: () => ({ configured: state.configured }) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
import { GET } from '@/apps/admin/app/api/admin/webhook-health/route';
beforeEach(() => { state.failingTable = ''; state.configured = true; });
afterEach(() => vi.clearAllMocks());

it('does not report healthy just because there are no events and therefore no alerts', async () => {
  const response = await GET(new NextRequest('https://admin.elevateforhumanity.org/api/admin/webhook-health'));
  const body = await response.json(); expect(response.status).toBe(200);
  expect(body.healthy).toBe(false); expect(body.providers[0].state).toBe('configured_no_activity');
});
it.each(['webhook_events_processed', 'v_paid_not_enrolled', 'v_enrolled_not_paid', 'payment_integrity_flags'])('reports unavailable evidence instead of zero counts when %s fails', async table => {
  state.failingTable = table;
  const response = await GET(new NextRequest('https://admin.elevateforhumanity.org/api/admin/webhook-health'));
  expect(response.status).toBe(500); expect(await response.json()).toEqual({ error: 'Health check failed' });
});
