import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { checkCertificationEligibility } from '@/lib/services/course-certification-eligibility';
import { createAdminClient } from '@/lib/supabase/admin';

const USER_ID   = 'user-abc';
const COURSE_ID = 'course-xyz';

function buildMockDb(overrides: Record<string, any> = {}) {
  const defaults: Record<string, any> = {
    course_lessons: { data: [
      { id: 'l1', title: 'Intro', lesson_type: 'reading',    is_required: true, passing_score: null, requires_evidence: false, requires_signoff: false },
      { id: 'l2', title: 'Quiz',  lesson_type: 'checkpoint', is_required: true, passing_score: 70,   requires_evidence: false, requires_signoff: false },
    ], error: null },
    lesson_progress: { data: [
      { lesson_id: 'l1', completed: true },
      { lesson_id: 'l2', completed: true },
    ], error: null },
    checkpoint_scores: { data: [
      { lesson_id: 'l2', passed: true },
    ], error: null },
    student_lesson_evidence: { data: [], error: null },
    student_skill_signoffs:  { data: [], error: null },
    practical_requirements:  { data: [], error: null },
    student_practical_progress: { data: [], error: null },
  };

  const merged = { ...defaults, ...overrides };

  const makeQuery = (table: string) => {
    const result = merged[table] ?? { data: [], error: null };
    const q: any = {
      select: () => q,
      eq:     () => q,
      in:     () => q,
      or:     () => q,
      not:    () => q,
      filter: () => q,
      order:  () => q,
      maybeSingle: () => Promise.resolve(result),
      then: (resolve: any) => Promise.resolve(result).then(resolve),
    };
    return q;
  };

  return { from: (table: string) => makeQuery(table) };
}

describe('checkCertificationEligibility', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns eligible when all lessons complete and checkpoints passed', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb());
    const result = await checkCertificationEligibility(USER_ID, COURSE_ID);
    expect(result.eligible).toBe(true);
    expect(result.unmetRequirements).toHaveLength(0);
  });

  it('returns eligible=true when no required lessons exist', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      course_lessons: { data: [], error: null },
    }));
    const result = await checkCertificationEligibility(USER_ID, COURSE_ID);
    expect(result.eligible).toBe(true);
  });

  it('blocks when a required lesson is not complete', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      lesson_progress: { data: [
        { lesson_id: 'l1', completed: false },
        { lesson_id: 'l2', completed: true },
      ], error: null },
    }));
    const result = await checkCertificationEligibility(USER_ID, COURSE_ID);
    expect(result.eligible).toBe(false);
    expect(result.unmetRequirements.some(r => r.code === 'LESSON_NOT_COMPLETE')).toBe(true);
  });

  it('blocks when a checkpoint has not been passed', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      checkpoint_scores: { data: [], error: null }, // no passing scores
    }));
    const result = await checkCertificationEligibility(USER_ID, COURSE_ID);
    expect(result.eligible).toBe(false);
    expect(result.unmetRequirements.some(r => r.code === 'ASSESSMENT_NOT_PASSED')).toBe(true);
  });

  it('blocks when required evidence is not approved', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      course_lessons: { data: [
        { id: 'l1', title: 'Lab', lesson_type: 'lab', is_required: true, passing_score: null, requires_evidence: true, requires_signoff: false },
      ], error: null },
      lesson_progress: { data: [{ lesson_id: 'l1', completed: true }], error: null },
      checkpoint_scores: { data: [], error: null },
      student_lesson_evidence: { data: [], error: null }, // no approved evidence
    }));
    const result = await checkCertificationEligibility(USER_ID, COURSE_ID);
    expect(result.eligible).toBe(false);
    expect(result.unmetRequirements.some(r => r.code === 'EVIDENCE_NOT_APPROVED')).toBe(true);
  });

  it('blocks when required skill signoff is not approved', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      course_lessons: { data: [
        { id: 'l1', title: 'Clinical', lesson_type: 'clinical', is_required: true, passing_score: null, requires_evidence: false, requires_signoff: true },
      ], error: null },
      lesson_progress: { data: [{ lesson_id: 'l1', completed: true }], error: null },
      checkpoint_scores: { data: [], error: null },
      student_skill_signoffs: { data: [], error: null }, // no approved signoffs
    }));
    const result = await checkCertificationEligibility(USER_ID, COURSE_ID);
    expect(result.eligible).toBe(false);
    expect(result.unmetRequirements.some(r => r.code === 'SIGNOFF_NOT_APPROVED')).toBe(true);
  });

  it('unmetRequirements contains lessonId and message for each block', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      lesson_progress: { data: [], error: null }, // nothing complete
    }));
    const result = await checkCertificationEligibility(USER_ID, COURSE_ID);
    expect(result.eligible).toBe(false);
    for (const req of result.unmetRequirements) {
      expect(req.code).toBeTruthy();
      expect(req.message).toBeTruthy();
    }
  });
});
