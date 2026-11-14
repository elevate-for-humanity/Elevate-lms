import assert from 'node:assert/strict';
import { test } from 'vitest';
import { selectOnboardingEnrollment } from '@/lib/learner/onboarding-enrollment';

const program = { enrollment_id: 'program-owner', source_table: 'program_enrollments', status: 'active' };
test('newer external assignments do not replace the program owning document requirements', () => {
  const partner = { enrollment_id: 'provider-course', source_table: 'partner_lms_enrollments', status: 'active' };
  const course = { enrollment_id: 'direct-course', source_table: 'course_enrollments', status: 'active' };
  assert.equal(selectOnboardingEnrollment([partner, course, program]), program);
});
test('active program takes precedence over a completed program', () => {
  const completed = { ...program, enrollment_id: 'old-program', status: 'completed' };
  assert.equal(selectOnboardingEnrollment([completed, program]), program);
});
test('retains a completed program when no active program exists', () => {
  const completed = { ...program, status: 'completed' };
  assert.equal(selectOnboardingEnrollment([completed]), completed);
});
test('does not use foreign enrollment IDs when no program is assigned', () => {
  assert.equal(selectOnboardingEnrollment([{ source_table: 'course_enrollments', status: 'active' }]), null);
  assert.equal(selectOnboardingEnrollment([]), null);
});
