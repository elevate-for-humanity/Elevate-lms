import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ tables: {} as Record<string, any[]>, writes: 0 }));
const db = vi.hoisted(() => ({
  auth: { getUser: async () => ({ data: { user: { id: 'teacher' } } }) },
  from: (table: string) => {
    const builder: any = {};
    for (const method of ['select', 'eq', 'in', 'or', 'order', 'limit', 'contains', 'is']) builder[method] = () => builder;
    builder.then = (resolve: any) => Promise.resolve({ data: state.tables[table] ?? [], error: null }).then(resolve);
    builder.insert = () => { state.writes++; return builder; };
    return builder;
  },
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => db }));
vi.mock('@/lib/admin/portal-preview', () => ({ resolvePortalPreviewSubject: async () => ({ userId: 'teacher', previewing: false }) }));
vi.mock('@/lib/program-holder/syllabus-course', () => ({ syncHolderSecondaryAssignments: async () => {} }));
import { getUserEnrollments } from '@/lib/enrollments/getUserEnrollments';
beforeEach(() => {
  state.writes = 0;
  state.tables = {
    course_enrollments: [{ id: 'enrollment', student_id: 'teacher', course_id: 'course', status: 'active', progress: '0' }],
    courses: [{ id: 'course', title: 'EPA 608', program_id: 'program' }],
    programs: [{ id: 'program', title: 'HVAC Technician', slug: 'hvac-technician' }],
  };
});
it('retains HVAC guidance context for a course-only learner without creating a program enrollment', async () => {
  const result = await getUserEnrollments('teacher');
  expect(result.error).toBeNull();
  expect(result.enrollments).toHaveLength(1);
  expect(result.enrollments[0]).toMatchObject({ source_table: 'course_enrollments', course_id: 'course', program_id: 'program', program_slug: 'hvac-technician', continue_url: '/lms/courses/course' });
  expect(state.writes).toBe(0);
});
it('keeps unassociated courses unassociated', async () => {
  state.tables.courses[0].program_id = null;
  const result = await getUserEnrollments('teacher');
  expect(result.enrollments[0].program_slug).toBeNull();
  expect(result.enrollments[0].program_id).toBeNull();
});
