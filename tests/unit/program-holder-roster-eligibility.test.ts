import { describe, expect, it } from 'vitest';
import { isIsolatedQaHolderRosterProfile, isLearnerRosterProfile } from '../../lib/program-holder/roster-eligibility';

describe('Program Holder learner roster boundary', () => {
  it.each([
    'student',
    'learner',
    'apprentice',
    'barber_apprentice',
    'cosmetology_apprentice',
    'STUDENT',
  ])('accepts a learner role: %s', (role) => {
    expect(isLearnerRosterProfile({ id: 'learner-id', role, email: 'learner@outlook.com' })).toBe(
      true,
    );
  });
  it.each([
    'admin',
    'super_admin',
    'instructor',
    'program_holder',
    'employer',
    'staff',
    'pending',
    '',
    null,
    undefined,
  ])('rejects a non-learner role: %s', (role) => {
    expect(isLearnerRosterProfile({ id: 'staff-id', role, email: 'staff@example.test' })).toBe(
      false,
    );
  });
  it('rejects QA accounts and missing identities even with a learner role', () => {
    expect(isLearnerRosterProfile({ id: 'qa-id', role: 'student', email: 'TEST@QA.INVALID' })).toBe(
      false,
    );
    expect(isLearnerRosterProfile({ role: 'student' })).toBe(false);
    expect(isLearnerRosterProfile({ id: '', role: 'student' })).toBe(false);
  });
  it.each([
    'testbarber@elevatetest.com',
    'jozanna.george+program_holder@elevate-test.dev',
    'user@test.elevateforhumanity.org',
    'person@example.com',
    'student@example.test',
    ' QA@QA.INVALID ',
  ])('excludes explicit test identities from the live roster: %s', (email) => {
    expect(isLearnerRosterProfile({ id: 'test-id', role: 'student', email })).toBe(false);
  });
  it('keeps real learners whose names or email local parts contain test', () => {
    expect(
      isLearnerRosterProfile({ id: 'real-id', role: 'student', email: 'testa@gmail.com' }),
    ).toBe(true);
  });
  it('does not require optional email for an identified learner', () => {
    expect(isLearnerRosterProfile({ id: 'learner-id', role: 'learner' })).toBe(true);
  });
});

it('excludes named QA fixture accounts from production directories', async () => {
  const { isProductionRosterProfile } = await import('@/lib/program-holder/roster-eligibility');
  expect(isProductionRosterProfile({ id: 'qa', role: 'staff', full_name: '[QA E2E] Staff', email: 'staff@elevateforhumanity.org' })).toBe(false);
  expect(isProductionRosterProfile({ id: 'staff', role: 'staff', full_name: 'Office Staff', email: 'staff@elevateforhumanity.org' })).toBe(true);
  expect(isProductionRosterProfile({ id: 'qa', role: 'admin', email: 'admin@qa.invalid' })).toBe(false);
});

describe('isolated QA holder roster', () => {
  const profile = {
    id: '49b10639-762b-4e64-8111-78a7adbd4f3d',
    role: 'student',
    full_name: '[QA E2E] Holder Student',
    email: 'qa-portal-e2e-45470438494-1-4-holder-student@qa.invalid',
  };
  const context = {
    supabaseUrl: 'https://isdgjcdabhxxozarmxta.supabase.co',
    holderFeatures: { qa_e2e: true, isolated: true, qa_run_id: '45470438494-1-4' },
  };
  it('keeps the marked student in its isolated, same-run holder roster', () => {
    expect(isIsolatedQaHolderRosterProfile(profile, context)).toBe(true);
    expect(isLearnerRosterProfile(profile)).toBe(false);
  });
  it.each([
    undefined, '', 'invalid', 'https://cuxzzpsyufcewtmicszk.supabase.co',
    'https://another-project.supabase.co', 'http://isdgjcdabhxxozarmxta.supabase.co',
    'https://isdgjcdabhxxozarmxta.supabase.co.attacker.invalid',
    'https://user:password@isdgjcdabhxxozarmxta.supabase.co',
  ])('rejects every non-QA server origin: %s', (supabaseUrl) => {
    expect(isIsolatedQaHolderRosterProfile(profile, { ...context, supabaseUrl })).toBe(false);
  });
  it.each([
    undefined, null, {},
    { qa_e2e: true, isolated: false, qa_run_id: '45470438494-1-4' },
    { qa_e2e: false, isolated: true, qa_run_id: '45470438494-1-4' },
    { qa_e2e: true, isolated: true, qa_run_id: 'another-run' },
    { qa_e2e: true, isolated: true, qa_run_id: '' },
  ])('requires independently marked same-run holder context: %j', (holderFeatures) => {
    expect(isIsolatedQaHolderRosterProfile(profile, { ...context, holderFeatures })).toBe(false);
  });
  it.each([
    { role: 'admin' }, { role: 'program_holder' }, { id: 'not-a-uuid' },
    { full_name: 'Unmarked Student' }, { email: 'student@qa.invalid' },
    { email: 'qa-portal-e2e-45470438494-1-3-holder-student@qa.invalid' },
  ])('rejects unmarked, unrelated or privileged identities: %j', (changes) => {
    expect(isIsolatedQaHolderRosterProfile({ ...profile, ...changes }, context)).toBe(false);
  });
});
