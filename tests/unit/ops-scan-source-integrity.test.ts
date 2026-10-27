import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ failed: '', reads: [] as string[], admin: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => {
  state.admin();
  return { from: (table: string) => {
    state.reads.push(table);
    const q: any = { select: () => q, in: () => q, eq: () => q, gte: () => q, lt: () => q, order: () => q, limit: () => q,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], count: table === 'documents' ? 70 : 0, error: state.failed === table ? { message: 'Permission denied' } : null }).then(resolve),
    }; return q;
  } };
} }));
import { GET } from '@/apps/admin/app/api/cron/ops-scan/route';
const request = (token = 'test-secret') => new NextRequest('https://admin.example.test/api/cron/ops-scan', { headers: { authorization: `Bearer ${token}` } });
beforeEach(() => { state.failed = ''; state.reads = []; state.admin.mockClear(); vi.stubEnv('CRON_SECRET', 'test-secret'); });
afterEach(() => vi.unstubAllEnvs());
it('denies the literal undefined bearer token when no secret is configured', async () => {
  delete process.env.CRON_SECRET;
  expect((await GET(request('undefined'))).status).toBe(401);
  expect(state.admin).not.toHaveBeenCalled();
});
it('checks every source and preserves full counts even when the row sample is limited', async () => {
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect(state.reads).toEqual(['program_enrollments', 'documents', 'payments', 'failed_login_attempts', 'payroll_runs', 'onboarding_progress']);
  expect(await response.json()).toMatchObject({ status: 'completed', scan: { total: 70, complete: true, documents: { count: 70 } } });
});
it('returns an incomplete scan instead of a clean result when a source fails', async () => {
  state.failed = 'payments';
  const response = await GET(request());
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ status: 'partial', scan: { complete: false, payments: { status: 'unavailable', count: null } } });
});
