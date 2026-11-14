import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ user: { id: 'learner' } as { id: string } | null, error: null as string | null, enrollments: [] as any[] }));
vi.mock('@/lib/auth/requireAuth', () => ({ requireAuth: async () => ({ user: state.user, error: state.user ? null : new Error('Unauthorized') }) }));
vi.mock('@/lib/enrollments/getUserEnrollments', () => ({ getUserEnrollments: async () => ({ enrollments: state.enrollments, error: state.error }) }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
import { GET } from '@/apps/lms/app/api/learner/progress/route';
beforeEach(() => { state.user = { id: 'learner' }; state.error = null; state.enrollments = []; });
it('requires authentication', async () => {
  state.user = null;
  expect((await GET(new NextRequest('https://app.example.test/api/learner/progress'))).status).toBe(401);
});
it('returns the progress dashboard contract for a learner with no courses', async () => {
  const response = await GET(new NextRequest('https://app.example.test/api/learner/progress'));
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(await response.json()).toMatchObject({ data: { courses: [], overallProgress: { completionRate: 0 }, weeklyActivity: expect.any(Array) } });
});
it('does not disguise an enrollment query failure as an empty dashboard', async () => {
  state.error = 'Database unavailable';
  expect((await GET(new NextRequest('https://app.example.test/api/learner/progress'))).status).toBe(503);
});
