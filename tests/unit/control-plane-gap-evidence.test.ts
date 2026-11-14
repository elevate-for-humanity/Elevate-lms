import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ failure: false }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from(table: string) {
  const records: Record<string, any[]> = {
    programs: [{ id: 'p', title: 'Training', soc_code: '1', occupation: 'Trade' }],
    lms_courses: [{ id: 'c', title: 'Training', program_id: null }],
    program_courses: [{ program_id: 'p', course_id: 'c' }],
    course_modules: [{ id: 'm', title: 'Module', course_id: 'c' }],
    course_lessons: [{ id: 'l', title: 'Lesson', quiz_questions: [{ question: 'Assessment' }] }],
    quizzes: [], assessments: [],
  };
  if (!(table in records)) throw new Error(`Unexpected table ${table}`);
  let excluded = false;
  const q: any = { select: () => q, in: () => q, limit: () => q,
    eq: (field: string) => { if (field === 'is_apprenticeship') excluded = true; return q; },
    lt: () => { excluded = true; return q; },
    then: (resolve: any) => resolve({ data: excluded ? [] : records[table], error: state.failure && table === 'course_lessons' ? new Error('Unavailable') : null }),
  };
  return q;
} }) }));
import { scanAllGaps } from '@/lib/ai/course-gap-detection';
beforeEach(() => { state.failure = false; });
it('uses published LMS relationships and recorded assessments', async () => {
  expect((await scanAllGaps()).gaps).toEqual([]);
});
it('rejects an incomplete scan when curriculum evidence cannot be read', async () => {
  state.failure = true;
  await expect(scanAllGaps()).rejects.toThrow();
});
