// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ role: 'student', owns: true, saveError: false, progressComplete: false }));
const writes = vi.hoisted(() => vi.fn());
const privileged = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: { id: 'signed-in-learner' } } }) },
  from: (table: string) => {
    const q: any = { select: () => q, eq: () => q, or: () => q, in: () => q, is: () => q,
      maybeSingle: async () => ({ data: { role: state.role }, error: null }),
      then: (resolve: any) => resolve({ data: state.owns ? [{ id: 'owned-program' }] : [], error: null }),
    }; return q;
  },
}) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => {
  privileged();
  return { from: (table: string) => {
    const q: any = {
      update: (payload: unknown) => { writes(table, payload); return q; },
      upsert: async (payload: unknown) => { writes(table, payload); return { error: null }; },
      eq: () => q, in: (field: string, ids: string[]) => { expect(ids).toEqual(['owned-program']); return q; },
      or: (scope: string) => { expect(scope).toContain('signed-in-learner'); return q; },
      is: () => q, select: () => q,
      maybeSingle: async () => ({ data: table === 'onboarding_progress' ? { status: state.progressComplete ? 'completed' : 'in_progress' } : { id: 'signed-in-learner' }, error: null }),
      then: (resolve: any) => resolve({ data: state.saveError ? [] : [{ id: 'owned-program' }], error: state.saveError ? { message: 'write failed' } : null }),
    }; return q;
  } };
} }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
import { acknowledgeLearnerOrientation } from '@/apps/lms/app/lms/(app)/orientation/actions';
beforeEach(() => { state.role='student'; state.owns=true; state.saveError=false; state.progressComplete=false; writes.mockClear(); privileged.mockClear(); });
const form = () => { const f = new FormData(); f.set('reviewed','yes'); f.set('user_id','another-student'); return f; };
describe('learner orientation acknowledgement', () => {
  it('requires an explicit acknowledgement', async () => {
    expect((await acknowledgeLearnerOrientation({error:''},new FormData())).error).toContain('check the acknowledgement');
    expect(privileged).not.toHaveBeenCalled();
  });
  it('does not let an administrator complete a learner acknowledgement', async () => {
    state.role='admin';
    expect((await acknowledgeLearnerOrientation({error:''},form())).error).toContain('Only the learner');
    expect(privileged).not.toHaveBeenCalled();
  });
  it('requires a session-visible owned enrollment before any privileged write', async () => {
    state.owns=false;
    expect((await acknowledgeLearnerOrientation({error:''},form())).error).toContain('could not be verified');
    expect(privileged).not.toHaveBeenCalled();
  });
  it('records only orientation and ignores a forged target-user field', async () => {
    await expect(acknowledgeLearnerOrientation({error:''},form())).rejects.toThrow('redirect:/lms/onboarding');
    expect(writes).toHaveBeenCalledWith('onboarding_progress',expect.objectContaining({ user_id: 'signed-in-learner', status: 'in_progress' }));
    expect(JSON.stringify(writes.mock.calls)).not.toContain('another-student');
    expect(JSON.stringify(writes.mock.calls)).not.toContain('onboarding_completed');
    expect(JSON.stringify(writes.mock.calls)).not.toContain('documents_submitted_at');
  });
  it('preserves an already completed onboarding status', async () => {
    state.progressComplete=true;
    await expect(acknowledgeLearnerOrientation({error:''},form())).rejects.toThrow('redirect:/lms/onboarding');
    expect(writes).toHaveBeenCalledWith('onboarding_progress',expect.objectContaining({status:'completed'}));
  });
  it('shows failure without marking the profile complete when the enrollment write fails', async () => {
    state.saveError=true;
    expect((await acknowledgeLearnerOrientation({error:''},form())).error).toContain('could not be fully saved');
    expect(writes.mock.calls.some(([table])=>table==='profiles')).toBe(false);
  });
});
