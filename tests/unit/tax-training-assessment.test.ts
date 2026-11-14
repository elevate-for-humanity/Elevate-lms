import { describe, expect, it } from 'vitest';
import {
  applicationSchema,
  gradeExam,
  pretest,
  finalTest,
} from '@/lib/tax-software/recruiting/policy';
import { assessments, gradeAssessment } from '@/lib/tax-software/training/assessment';

describe('tax recruiting assessments', () => {
  it('requires 80 percent on the final and rejects incomplete or forged responses', () => {
    const correct = finalTest.map((q) => q.answer);
    expect(gradeExam('final', correct)).toEqual({ score: 100, passed: true });
    const eight = correct.map((a, i) => (i < 2 ? (a + 1) % 3 : a));
    expect(gradeExam('final', eight)).toEqual({ score: 80, passed: true });
    eight[2] = (correct[2] + 1) % 3;
    expect(gradeExam('final', eight).passed).toBe(false);
    for (const invalid of [
      [],
      correct.slice(1),
      [...correct, 0],
      correct.map(() => -1),
      correct.map(() => 0.5),
    ]) {
      expect(() => gradeExam('final', invalid)).toThrow('INVALID_ASSESSMENT');
    }
    expect(
      gradeExam(
        'pretest',
        pretest.map((q) => q.answer),
      ).passed,
    ).toBe(true);
  });
  it('binds module grades to known modules and server answer keys', () => {
    for (const module of assessments) {
      expect(gradeAssessment(module.id, [module.answer])).toEqual({ score: 100, passed: true });
      expect(gradeAssessment(module.id, [(module.answer + 1) % 3]).passed).toBe(false);
      expect(() => gradeAssessment(module.id, [999])).toThrow();
    }
    expect(() => gradeAssessment('unknown', [0])).toThrow();
    expect(() => gradeAssessment(assessments[0].id, [0, 1])).toThrow();
  });
  it('does not accept client supplied hiring decisions, scores or identities', () => {
    const applicant = {
      name: 'Test Applicant',
      phone: '',
      location: 'Indianapolis',
      preference: 'remote',
      credential: 'Trainee',
      experience: 'I would like to learn tax preparation.',
      privacyAcknowledged: true,
    };
    expect(applicationSchema.safeParse(applicant).success).toBe(true);
    for (const extra of [{ user_id: 'other' }, { status: 'hired' }, { score: 100 }]) {
      expect(applicationSchema.safeParse({ ...applicant, ...extra }).success).toBe(false);
    }
    expect(applicationSchema.safeParse({ ...applicant, privacyAcknowledged: false }).success).toBe(
      false,
    );
  });
});
