import { describe, expect, it, vi } from 'vitest';
import { prepareQaHolderRosterProfile } from '../../scripts/qa/holder-roster-fixture.mjs';
import { isLearnerRosterProfile } from '@/lib/program-holder/roster-eligibility';

function fixture() {
  const runId = '45443372517-1-4';
  const userId = 'qa-holder-student-id';
  const email = `qa-portal-e2e-${runId}-holder-student@qa.invalid`;
  const user = {
    id: userId, email,
    app_metadata: { qa_e2e: true, qa_run_id: runId, role: 'student' },
  };
  let profile = { id: userId, email, role: 'student', full_name: '[QA E2E] Holder Student' };
  const filters: Array<[string, unknown]> = [];
  let patch: Partial<typeof profile> = {};
  const query = {
    update: vi.fn((value) => { patch = value; return query; }),
    eq: vi.fn((key, value) => { filters.push([key, value]); return query; }),
    select: vi.fn(() => query),
    single: vi.fn(async () => {
      if (!filters.every(([key, value]) => profile[key as keyof typeof profile] === value))
        return { data: null, error: new Error('No matching fixture profile') };
      profile = { ...profile, ...patch };
      return { data: profile, error: null };
    }),
  };
  const db = {
    auth: { admin: {
      getUserById: vi.fn(async () => ({ data: { user }, error: null })),
      updateUserById: vi.fn(),
    } },
    from: vi.fn((table) => {
      if (table !== 'profiles') throw new Error('Unexpected table mutation');
      return query;
    }),
  };
  const input = { db, supabaseUrl: 'https://isdgjcdabhxxozarmxta.supabase.co', runId, userId };
  return { input, user, query, filters, getProfile: () => profile };
}

describe('isolated Program Holder roster fixture', () => {
  it('provides a selectable learner without changing the QA Auth identity or production filtering', async () => {
    const f = fixture();
    const originalAuth = structuredClone(f.user);
    expect(isLearnerRosterProfile(f.getProfile())).toBe(false);
    const profile = await prepareQaHolderRosterProfile(f.input);
    expect(isLearnerRosterProfile(profile)).toBe(true);
    expect(profile.full_name).toBe(`Portal QA Holder Student ${f.input.runId}`);
    expect(profile.email).toBe(`qa-portal-e2e-${f.input.runId}-holder-student@roster.qa.invalid`);
    expect(f.filters).toEqual([['id', f.input.userId], ['role', 'student'], ['email', f.user.email]]);
    expect(f.user).toEqual(originalAuth);
    expect(f.input.db.auth.admin.updateUserById).not.toHaveBeenCalled();
    expect(isLearnerRosterProfile({ ...profile, email: f.user.email })).toBe(false);
  });

  it.each([
    'https://production.supabase.co',
    'http://isdgjcdabhxxozarmxta.supabase.co',
    'https://isdgjcdabhxxozarmxta.supabase.co.attacker.invalid',
  ])('refuses any non-isolated project before reading or writing: %s', async (supabaseUrl) => {
    const f = fixture();
    await expect(prepareQaHolderRosterProfile({ ...f.input, supabaseUrl })).rejects.toThrow('isolated QA project');
    expect(f.input.db.auth.admin.getUserById).not.toHaveBeenCalled();
    expect(f.input.db.from).not.toHaveBeenCalled();
  });

  it.each(['qa-marker', 'wrong-run', 'wrong-role', 'wrong-email', 'wrong-id'])('refuses an unverified Auth fixture: %s', async (reason) => {
    const f = fixture();
    if (reason === 'qa-marker') f.user.app_metadata.qa_e2e = false;
    if (reason === 'wrong-run') f.user.app_metadata.qa_run_id = 'another-run';
    if (reason === 'wrong-role') f.user.app_metadata.role = 'admin';
    if (reason === 'wrong-email') f.user.email = 'student@example.invalid';
    if (reason === 'wrong-id') f.user.id = 'another-user';
    await expect(prepareQaHolderRosterProfile(f.input)).rejects.toThrow('non-fixture');
    expect(f.input.db.from).not.toHaveBeenCalled();
  });

  it('fails closed if the expected profile changed before the conditional update', async () => {
    const f = fixture();
    f.getProfile().role = 'admin';
    await expect(prepareQaHolderRosterProfile(f.input)).rejects.toThrow('could not be verified');
    expect(f.getProfile().email).toBe(f.user.email);
    expect(f.getProfile().full_name).toBe('[QA E2E] Holder Student');
  });

  it('fails closed if a returned profile does not match the exact fixture', async () => {
    const f = fixture();
    f.query.single.mockResolvedValue({ data: { ...f.getProfile(), id: 'other-student' }, error: null });
    await expect(prepareQaHolderRosterProfile(f.input)).rejects.toThrow('could not be verified');
  });
});
