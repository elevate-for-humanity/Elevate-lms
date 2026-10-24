import { describe, expect, it } from 'vitest';
import { isLearnerRosterProfile } from '../../lib/program-holder/roster-eligibility';

describe('Program Holder learner roster boundary', () => {
  it.each(['student', 'learner', 'apprentice', 'barber_apprentice', 'cosmetology_apprentice', 'STUDENT'])('accepts a learner role: %s', role => {
    expect(isLearnerRosterProfile({ id: 'learner-id', role, email: 'learner@example.test' })).toBe(true);
  });
  it.each(['admin', 'super_admin', 'instructor', 'program_holder', 'employer', 'staff', 'pending', '', null, undefined])('rejects a non-learner role: %s', role => {
    expect(isLearnerRosterProfile({ id: 'staff-id', role, email: 'staff@example.test' })).toBe(false);
  });
  it('rejects QA accounts and missing identities even with a learner role', () => {
    expect(isLearnerRosterProfile({ id: 'qa-id', role: 'student', email: 'TEST@QA.INVALID' })).toBe(false);
    expect(isLearnerRosterProfile({ role: 'student' })).toBe(false);
    expect(isLearnerRosterProfile({ id: '', role: 'student' })).toBe(false);
  });
  it('does not require optional email for an identified learner', () => {
    expect(isLearnerRosterProfile({ id: 'learner-id', role: 'learner' })).toBe(true);
  });
});

