import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ employer: { id: 'owned-employer', approved: true } as { id: string; approved: boolean } | null, data: { id: 'posting' } as { id: string } | null, update: vi.fn(), filters: [] as unknown[][], invalidate: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock('next/cache', () => ({ revalidatePath: state.invalidate }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: async () => ({ user: { id: 'signed-in-user' } }) }));
vi.mock('@/lib/employer/employer-context', () => ({ getEmployerRecord: async () => state.employer }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: () => {
  const q: any = { update: (payload: unknown) => { state.update(payload); return q; }, eq: (...args: unknown[]) => { state.filters.push(args); return q; }, select: () => q, maybeSingle: async () => ({ data: state.data, error: null }) }; return q;
} }) }));
import { updateEmployerPosting } from '@/apps/lms/app/employer/postings/[id]/edit/actions';
const form = (status = 'pending') => { const data = new FormData(); data.set('title', 'Licensed apprentice'); data.set('description', 'A verified role for qualified program graduates.'); data.set('location', 'Indianapolis'); data.set('status', status); return data; };
beforeEach(() => { state.employer = { id: 'owned-employer', approved: true }; state.data = { id: 'posting' }; state.update.mockClear(); state.invalidate.mockClear(); state.filters = []; });
it('saves within the owned employer and returns edited listings to review', async () => {
  await expect(updateEmployerPosting('posting', form())).rejects.toThrow('REDIRECT:/employer/postings/posting');
  expect(state.filters).toEqual([['id', 'posting'], ['employer_id', 'owned-employer']]);
  expect(state.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', approved_by: null, approved_at: null, title: 'Licensed apprentice', job_title: 'Licensed apprentice' }));
  expect(state.invalidate).toHaveBeenCalledWith('/employer/jobs');
});
it('rejects an unapproved employer and attempts to self-publish', async () => {
  state.employer!.approved = false;
  await expect(updateEmployerPosting('posting', form())).rejects.toThrow('approved employer');
  state.employer!.approved = true;
  await expect(updateEmployerPosting('posting', form('active'))).rejects.toThrow('Invalid posting status');
  expect(state.update).not.toHaveBeenCalled();
});
it('does not report success for a posting outside the employer account', async () => {
  state.data = null;
  await expect(updateEmployerPosting('foreign-posting', form())).rejects.toThrow('not found in your employer account');
  expect(state.invalidate).not.toHaveBeenCalled();
});
