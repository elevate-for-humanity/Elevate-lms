import { expect, it } from 'vitest';
import { detectCourseGaps, createGapDraftJobs } from '@/lib/studio/course-gap-detection';

function database(failTable?: string) {
  const records: Record<string, unknown[]> = {
    programs: [{ id: 'p', name: 'Training', slug: 'training' }],
    program_courses: [], lms_courses: [{ id: 'c', title: 'Training', program_id: 'p' }],
    course_modules: [{ id: 'm', title: 'Module' }],
    course_lessons: [{ id: 'l', title: 'Lesson', quiz_questions: [{ question: 'Recorded assessment' }] }],
    quizzes: [], credentials: [{ id: 'credential' }], program_credentials: [{ credential_id: 'credential' }],
  };
  return { from(table: string) {
    if (!(table in records)) throw new Error(`Unexpected table ${table}`);
    const q: any = { then: (resolve: any) => resolve({ data: table === failTable ? null : records[table], error: table === failTable ? new Error('Evidence unavailable') : null }) };
    for (const method of ['select', 'eq', 'in', 'order', 'limit']) q[method] = () => q;
    return q;
  } } as any;
}
it('recognizes direct LMS program association and recorded inline assessments', async () => {
  const result = await detectCourseGaps(database());
  expect(result.gaps).toEqual([]);
  expect(result.courses_analyzed).toBe(1);
});
it('does not report a failed lesson read as missing curriculum', async () => {
  await expect(detectCourseGaps(database('course_lessons'))).rejects.toThrow('Evidence unavailable');
});
it('does not report a failed draft write as successful job creation', async () => {
  const q: any = { select: () => q, eq: () => q, limit: async () => ({ data: [], error: null }), insert: async () => ({ error: new Error('Write unavailable') }) };
  await expect(createGapDraftJobs({ from: () => q } as any, [{ type: 'no_course', severity: 'critical', program_id: 'p' }] as any)).rejects.toThrow('Gap draft job creation failed');
});
