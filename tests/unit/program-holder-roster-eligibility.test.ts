import { describe, expect, it } from 'vitest';
import { isIsolatedQaProgramHolderRosterContext, isLearnerRosterProfile } from '../../lib/program-holder/roster-eligibility';

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
  it('rejects other reserved .invalid identities even when the QA fixture switch is on', () => {
    for (const email of ['person@other.invalid', 'student@example.invalid', 'qa-portal-e2e-45102978350-holder-active-student@attacker.invalid']) {
      const fixture = { id: 'qa-test-id', role: 'student', email };
      expect(isLearnerRosterProfile(fixture)).toBe(false);
      expect(isLearnerRosterProfile(fixture, { includeIsolatedQaFixtures: true })).toBe(false);
    }
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


describe('Isolated Program Holder roster acceptance', () => {
  const qaUrl = 'https://isdgjcdabhxxozarmxta.supabase.co';
  const active = {
    id: 'qa-user-id',
    role: 'student',
    full_name: 'QA Holder Active Student',
    email: 'qa-portal-e2e-45102978350-holder-active-student@qa.invalid',
  };
  const completed = {
    ...active,
    email: 'qa-portal-e2e-45102978350-holder-completed-student@qa.invalid',
  };
  it('requires both the exact QA database and explicit browser-test mode', () => {
    expect(isIsolatedQaProgramHolderRosterContext({ supabaseUrl: qaUrl, testMode: 'true' })).toBe(true);
    expect(isIsolatedQaProgramHolderRosterContext({ supabaseUrl: qaUrl, testMode: 'false' })).toBe(false);
    expect(isIsolatedQaProgramHolderRosterContext({ supabaseUrl: 'https://cuxzzpsyufcewtmicszk.supabase.co', testMode: 'true' })).toBe(false);
    expect(isIsolatedQaProgramHolderRosterContext({ supabaseUrl: 'https://isdgjcdabhxxozarmxta.supabase.co.attacker.invalid', testMode: 'true' })).toBe(false);
    expect(isIsolatedQaProgramHolderRosterContext({ supabaseUrl: 'invalid', testMode: 'true' })).toBe(false);
  });
  it.each(['45102978350', '45102978350-1-4'])(
    'admits both disposable holder learners for run %s only in isolated QA',
    (runId) => {
      for (const learner of [active, completed]) {
        const fixture = { ...learner, email: learner.email.replace('45102978350', runId) };
        expect(isLearnerRosterProfile(fixture)).toBe(false);
        expect(isLearnerRosterProfile(fixture, { includeIsolatedQaFixtures: true })).toBe(true);
      }
    },
  );
  it('rejects identities outside the approved holder fixtures', () => {
    for (const runId of ['45102978350-1', '45102978350-1-4-2', '45102978350-1-four']) {
      const fixture = { ...active, email: `qa-portal-e2e-${runId}-holder-active-student@qa.invalid` };
      expect(isLearnerRosterProfile(fixture, { includeIsolatedQaFixtures: true })).toBe(false);
    }
    expect(isLearnerRosterProfile({ ...active, role: 'staff' }, { includeIsolatedQaFixtures: true })).toBe(false);
    expect(isLearnerRosterProfile({ ...active, email: 'qa-portal-e2e-45102978350-holder-active-student@other.invalid' }, { includeIsolatedQaFixtures: true })).toBe(false);
    expect(isLearnerRosterProfile({ ...active, email: 'other@qa.invalid' }, { includeIsolatedQaFixtures: true })).toBe(false);
    expect(isLearnerRosterProfile({ ...active, id: '' }, { includeIsolatedQaFixtures: true })).toBe(false);
  });
  it('preserves live learner inclusion and production exclusions', () => {
    expect(isLearnerRosterProfile({ id: 'real', role: 'student', email: 'person@gmail.com' }, { includeIsolatedQaFixtures: true })).toBe(true);
    expect(isLearnerRosterProfile({ ...active, full_name: '[QA E2E] Program Holder', role: 'program_holder' }, { includeIsolatedQaFixtures: true })).toBe(false);
  });
});
describe('QA fixture holder roster boundary', () => {
  it('admits the QA fixture student to its own QA holder roster', async () => {
    const { isQaFixtureRosterProfile } = await import(
      '@/lib/program-holder/roster-eligibility'
    );
    expect(
      isQaFixtureRosterProfile({
        id: 'qa-student-id',
        role: 'student',
        full_name: '[QA E2E] Holder Student',
        email: 'qa-portal-e2e-1-holder-student@qa.invalid',
      }),
    ).toBe(true);
  });
  it('still rejects non-learner roles and missing identities', async () => {
    const { isQaFixtureRosterProfile } = await import(
      '@/lib/program-holder/roster-eligibility'
    );
    expect(isQaFixtureRosterProfile({ id: 'qa-id', role: 'program_holder' })).toBe(false);
    expect(isQaFixtureRosterProfile({ role: 'student' })).toBe(false);
    expect(isQaFixtureRosterProfile({ id: '', role: 'student' })).toBe(false);
  });
  it('does not change the production boundary', async () => {
    const { isLearnerRosterProfile } = await import('@/lib/program-holder/roster-eligibility');
    expect(
      isLearnerRosterProfile({
        id: 'qa-student-id',
        role: 'student',
        full_name: '[QA E2E] Holder Student',
        email: 'qa-portal-e2e-1-holder-student@qa.invalid',
      }),
    ).toBe(false);
  });
});
