import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  employer: { id: 'owned-employer' } as { id: string } | null,
  role: 'employer', saved: vi.fn(), error: null as unknown,
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, handler: unknown) => handler }));
vi.mock('@/lib/employer/employer-context', () => ({ getEmployerRecord: async () => state.employer }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: { id: 'signed-in-employer' } }, error: null }) },
  from: () => {
    const query: any = { select: () => query, eq: () => query,
      maybeSingle: async () => ({ data: { role: state.role }, error: null }),
      insert: async () => ({ error: null }),
    };
    return query;
  },
}) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: () => ({
  insert: (payload: unknown) => { state.saved(payload); return { select: () => ({ single: async () => ({ data: state.error ? null : { id: 'report' }, error: state.error }) }) }; },
}) }) }));
import { POST } from '@/apps/lms/app/api/employer/reports/submit/route';
const payload = { periodStart: '2026-10-01', periodEnd: '2026-10-27', participantsServed: 8, completions: 5, placements: 4, retention90: 3, notes: 'Verified outcomes', employer_id: 'foreign-employer' };
const submit = (body = payload) => POST(new NextRequest('https://app.example.test/api/employer/reports/submit', { method: 'POST', body: JSON.stringify(body) }));
beforeEach(() => { state.employer = { id: 'owned-employer' }; state.role = 'employer'; state.error = null; state.saved.mockClear(); });
it('persists every metric and binds ownership to the authenticated employer', async () => {
  expect((await submit()).status).toBe(201);
  expect(state.saved).toHaveBeenCalledWith(expect.objectContaining({ quarter: '2026Q4', fiscal_year: 2026, submitted_by: 'signed-in-employer', data: expect.objectContaining({ employer_id: 'owned-employer', notes: 'Verified outcomes', metrics: { participants_served: 8, completions: 5, placements: 4, retention_90_day: 3 } }) }));
});
it('denies an unconnected employer before using the privileged writer', async () => {
  state.employer = null;
  expect((await submit()).status).toBe(403);
  expect(state.saved).not.toHaveBeenCalled();
});
it('rejects invalid periods and fractional metrics before writing', async () => {
  expect((await submit({ ...payload, periodEnd: '2026-09-01' })).status).toBe(400);
  expect((await submit({ ...payload, placements: 1.5 })).status).toBe(400);
  expect((await submit({ ...payload, periodStart: '2026-02-30' })).status).toBe(400);
  expect(state.saved).not.toHaveBeenCalled();
});
it('returns a failure when the complete report cannot be saved', async () => {
  state.error = { message: 'Database unavailable' };
  expect((await submit()).status).toBe(503);
  expect(state.saved).toHaveBeenCalledTimes(1);
});
