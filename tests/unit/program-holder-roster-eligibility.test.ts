import { describe, expect, it } from 'vitest';
import { isLearnerRosterProfile } from '../../lib/program-holder/roster-eligibility';

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
