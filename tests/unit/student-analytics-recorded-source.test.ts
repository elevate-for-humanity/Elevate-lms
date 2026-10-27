import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ user: { id: 'learner' } as { id: string } | null, error: false, filters: [] as unknown[][] }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, handler: unknown) => handler }));
vi.mock('@/lib/enrollments/getUserEnrollments', () => ({ getUserEnrollments: async () => ({ enrollments: [], error: null }) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
  from: () => { const q: any = { select: () => q, eq: (...args: unknown[]) => { state.filters.push(args); return q; }, order: () => q, range: async () => ({ data: [], error: state.error ? { message: 'Unavailable' } : null }) }; return q; },
}) }));
import { GET } from '@/apps/admin/app/api/analytics/analytics/student/route';
const request = () => new NextRequest('https://admin.example.test/api/analytics/analytics/student');
beforeEach(() => { state.user = { id: 'learner' }; state.error = false; state.filters = []; });
it('scopes recorded activity to the signed-in learner and preserves the analytics contract', async () => {
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect(state.filters).toContainEqual(['user_id', 'learner']);
  expect(await response.json()).toMatchObject({ completionRate: 0, coursesCompleted: 0, activeStreakDays: 0, last7Days: expect.any(Array) });
  expect(response.headers.get('cache-control')).toBe('private, no-store');
});
it('requires authentication and does not hide activity read failures', async () => {
  state.user = null;
  expect((await GET(request())).status).toBe(401);
  state.user = { id: 'learner' }; state.error = true;
  expect((await GET(request())).status).toBe(500);
});
