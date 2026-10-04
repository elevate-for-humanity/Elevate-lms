import { describe, it, expect } from 'vitest';
import { submitCoursePractical, reviewCoursePractical, practicalReviewerCourseIds } from '@/lib/lms/course-practical-workflow';
import { checkCompetencyGate } from '@/lib/lms/competency-gate';

function fixture() {
  const rows: Record<string, any[]> = {
    profiles: [{ id: 'instructor', role: 'instructor' }, { id: 'other', role: 'instructor' }, { id: 'learner', role: 'student' }],
    instructor_assignments: [{ course_id: 'course', instructor_id: 'instructor', active: true }],
    course_lessons: [{ id: 'lesson', course_id: 'course', practical_required: true, competency_checks: [], content_json: { experience: { practicalTask: { competencyKeys: ['safe-work'] } } } }],
    program_enrollments: [{ user_id: 'learner', course_id: 'course', status: 'active' }],
    course_practical_submissions: [], course_practical_reviews: [], step_submissions: [], learning_action_events: [],
  };
  const db: any = { from(table: string) {
    let mode = '', payload: any, column = ''; let ascending = true;
    const filters: Array<(row: any) => boolean> = [];
    const resolve = () => {
      let selected = rows[table].filter(row => filters.every(f => f(row)));
      if (mode === 'insert') { selected = (Array.isArray(payload) ? payload : [payload]).map((r: any) => ({ id: `${table}-${rows[table].length}`, reviewed_at: new Date().toISOString(), ...r })); rows[table].push(...selected); }
      if (mode === 'upsert') { const old = rows[table].find(r => r.learner_id === payload.learner_id && r.lesson_id === payload.lesson_id && r.interaction_id === payload.interaction_id); if (old) { Object.assign(old, payload); selected = [old]; } else { selected = [{ id: 'submission', ...payload }]; rows[table].push(...selected); } }
      if (mode === 'update') selected.forEach(row => Object.assign(row, payload));
      if (column) selected = [...selected].sort((a,b) => String(a[column]).localeCompare(String(b[column])) * (ascending ? 1 : -1));
      if (table === 'course_practical_submissions') selected = selected.map(row => ({ ...row, course_practical_reviews: rows.course_practical_reviews.filter(review => review.submission_id === row.id) }));
      return { data: selected, error: null };
    };
    const q: any = {
      select: () => q, eq: (key: string,value: any) => { filters.push(row => row[key] === value); return q; },
      in: (key: string,values: any[]) => { filters.push(row => values.includes(row[key])); return q; },
      order: (key: string,opts: any) => { column = key; ascending = opts?.ascending !== false; return q; },
      insert: (value: any) => { mode = 'insert'; payload = value; return q; }, upsert: (value: any) => { mode = 'upsert'; payload = value; return q; },
      update: (value: any) => { mode = 'update'; payload = value; return q; },
      single: async () => { const r = resolve(); return { ...r, data: r.data[0] ?? null }; },
      maybeSingle: async () => { const r = resolve(); return { ...r, data: r.data[0] ?? null }; },
      then: (callback: any) => Promise.resolve(resolve()).then(callback),
    }; return q;
  } };
  return { db, rows };
}
const input = { courseId: 'course', lessonId: 'lesson', interactionId: 'lesson-practical', competencyKeys: ['safe-work'], evidence: [{ type: 'url', value: 'https://example.test/evidence' }], learnerAttestation: true };
const review = { submissionId: 'submission', decision: 'approved', competencyResults: { 'safe-work': true }, comments: 'Observed required safety steps.' };

describe('practical submission to actual completion gate', () => {
  it('keeps submitted evidence blocked until assigned instructor verifies every competency', async () => {
    const { db, rows } = fixture();
    await submitCoursePractical(db, 'learner', input);
    expect((await checkCompetencyGate(db, { userId: 'learner', lessonId: 'lesson' })).allowed).toBe(false);
    await expect(reviewCoursePractical(db, 'other', review)).rejects.toThrow('FORBIDDEN');
    await expect(reviewCoursePractical(db, 'learner', review)).rejects.toThrow('FORBIDDEN');
    expect(rows.course_practical_reviews).toHaveLength(0);
    const result = await reviewCoursePractical(db, 'instructor', review);
    expect(result.practicalGate.allowed).toBe(true);
    expect(rows.course_practical_submissions).toHaveLength(1);
    expect(rows.step_submissions).toHaveLength(0); // No duplicate legacy evidence.
    expect(rows.learning_action_events.map(row => row.action)).toEqual(['request_expert_review','record_mastery','unlock_next']);
  });
  it.each(['rejected','revision_required'])('latest %s review overrides previous or legacy approvals', async decision => {
    const { db, rows } = fixture();
    rows.step_submissions.push({ user_id: 'learner', course_lesson_id: 'lesson', status: 'approved', competency_key: 'safe-work' });
    await submitCoursePractical(db, 'learner', input);
    rows.course_practical_reviews.push({ submission_id: 'submission', decision: 'approved', competency_results: { 'safe-work': true }, reviewer_id: 'instructor', reviewed_at: '2020-01-01T00:00:00Z' });
    const result = await reviewCoursePractical(db, 'instructor', { ...review, decision });
    expect(result.practicalGate.allowed).toBe(false);
    expect(rows.learning_action_events.some(row => row.action === 'unlock_next')).toBe(false);
  });
  it('blocks missing competency configuration, missing review, false competency approval and enrollment mismatch', async () => {
    const { db, rows } = fixture();
    await submitCoursePractical(db, 'learner', input);
    await expect(reviewCoursePractical(db, 'instructor', { ...review, competencyResults: { 'safe-work': false } })).rejects.toThrow('ALL_COMPETENCIES');
    rows.course_practical_submissions[0].status = 'approved';
    expect((await checkCompetencyGate(db, { userId: 'learner', lessonId: 'lesson' })).allowed).toBe(false);
    rows.course_lessons[0].content_json = {};
    expect((await checkCompetencyGate(db, { userId: 'learner', lessonId: 'lesson' })).missingKeys).toEqual(['practical_requirements_not_configured']);
    rows.course_lessons[0].content_json = { competencyId: 'safe-work' };
    rows.program_enrollments[0].status = 'withdrawn';
    await expect(submitCoursePractical(db, 'learner', input)).rejects.toThrow('ENROLLMENT_REQUIRED');
  });
  it('scopes reviewer queue to assigned courses', async () => {
    const { db } = fixture();
    expect(await practicalReviewerCourseIds(db, 'instructor')).toEqual(['course']);
    expect(await practicalReviewerCourseIds(db, 'other')).toEqual([]);
  });
});
