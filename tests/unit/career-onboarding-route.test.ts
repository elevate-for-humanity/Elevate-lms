import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ user: { id: 'enrolled-student' } as { id: string } | null, enrolled: true, upsert: vi.fn(async () => ({ error: null })) }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: (table: string) => table === 'resume_profiles' ? { upsert: state.upsert } : { select: () => ({ or: () => ({ is: () => ({ limit: () => ({ maybeSingle: async () => ({ data: state.enrolled ? { id: 'enrollment' } : null, error: null }) }) }) }) }) } }) }));
import { POST } from '../../apps/lms/app/api/learner/career-onboarding/route';
const request = () => new NextRequest('https://app.example.test/api/learner/career-onboarding', { method: 'POST', body: JSON.stringify({ user_id: 'someone-else', is_visible_to_employers: true }) });
beforeEach(() => { state.user = { id: 'enrolled-student' }; state.enrolled = true; state.upsert.mockClear(); });
it('requires authentication before creating a career profile', async () => {
  state.user = null;
  expect((await POST(request())).status).toBe(401);
  expect(state.upsert).not.toHaveBeenCalled();
});
it('requires enrollment before career activation', async () => {
  state.enrolled = false;
  expect((await POST(request())).status).toBe(403);
  expect(state.upsert).not.toHaveBeenCalled();
});
it('uses the authenticated identity and preserves profiles and visibility on retries', async () => {
  expect((await POST(request())).status).toBe(200);
  expect((await POST(request())).status).toBe(200);
  expect(state.upsert).toHaveBeenNthCalledWith(1, { user_id: 'enrolled-student' }, { onConflict: 'user_id', ignoreDuplicates: true });
  expect(state.upsert).toHaveBeenNthCalledWith(2, { user_id: 'enrolled-student' }, { onConflict: 'user_id', ignoreDuplicates: true });
});
