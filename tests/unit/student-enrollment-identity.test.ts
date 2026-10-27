import { describe, expect, it } from 'vitest';
import { hasActiveProgramEnrollment, learnerProgramKey, isEpaTestingProgram } from '@/lib/program-holder/enrollment-identity';
const student = { user_id: 'student-a', student_id: 'student-a', program_id: 'program-a', program_holder_id: 'holder-a' };
const active = { ...student, status: 'active' };
describe('canonical applicant and enrollment identity', () => {
  it('recognizes the same active student, program and assigned holder', () => expect(hasActiveProgramEnrollment(student, [active])).toBe(true));
  it.each([{ user_id: 'student-b', student_id: 'student-b' }, { program_id: 'program-b' }, { program_holder_id: 'holder-b' }])('does not merge another identity or assignment', difference => expect(hasActiveProgramEnrollment(student, [{ ...active, ...difference }])).toBe(false));
  it.each([{ status: 'completed' }, { status: 'pending' }, { revoked_at: '2026-10-20' }])('does not hide a new application based on inactive access', difference => expect(hasActiveProgramEnrollment(student, [{ ...active, ...difference }])).toBe(false));
  it.each([{ user_id: null, student_id: null }, { student_id: 'conflicting-student' }, { program_id: null }])('does not infer an incomplete or conflicting identity', difference => expect(hasActiveProgramEnrollment({ ...student, ...difference }, [active])).toBe(false));
  it('keeps separate programs distinct during converted-record deduplication', () => expect(learnerProgramKey(student)).not.toBe(learnerProgramKey({ ...student, program_id: 'program-b' })));
});
describe('approved EPA testing pathway', () => {
  it('permits the current HVAC pathway', () => expect(isEpaTestingProgram('hvac-technician')).toBe(true));
  it.each(['bookkeeping', 'business-administration', 'cosmetology-apprenticeship', '', undefined])('does not offer EPA testing for %s', slug => expect(isEpaTestingProgram(slug)).toBe(false));
});
