import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ historyError: false, apiError: false }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: async () => ({ id: 'admin', error: null }) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: (table: string) => {
  if (table !== 'system_errors') throw new Error('Unexpected error history authority');
  const q: any = { select: () => q, order: () => q, limit: async () => ({ data: [], error: state.historyError ? { message: 'Unavailable' } : null }) }; return q;
} }) }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: { id: 'admin' } }, error: null }) },
  from: () => ({ select: () => ({ limit: async () => ({ data: [], error: state.apiError ? { message: 'Database unavailable' } : null }) }) }),
}) }));
import { GET } from '@/apps/admin/app/api/admin/dev-studio/runtime-qa/route';
const request = () => new NextRequest('https://admin.example.test/api/admin/dev-studio/runtime-qa');
beforeEach(() => { state.historyError = false; state.apiError = false; });
it('does not attest to repository or browser checks that were never run', async () => {
  const response = await GET(request());
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(body.build_checks.every((check: any) => check.status === 'skipped' && !check.last_run)).toBe(true);
  expect(body.cloudflare_health.status).toBe('not_tested');
  expect(body.summary.score).toBeNull();
  expect(body.summary.scope).toBe('recent_recorded_server_errors');
});
it('recognizes a resolved Supabase error response as a failed probe', async () => {
  state.apiError = true;
  const response = await GET(request());
  expect((await response.json()).api_health).toMatchObject({ status: 'degraded', failures: 1 });
});
it('does not claim a clean error history when its query failed', async () => {
  state.historyError = true;
  expect((await GET(request())).status).toBe(503);
});
