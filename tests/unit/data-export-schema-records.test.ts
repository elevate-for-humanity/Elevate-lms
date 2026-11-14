import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ failed: '', data: {} as Record<string, any[]> }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: (table: string) => {
  const q: any = { select: () => q, in: () => q, eq: () => q, order: () => q, limit: () => q,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: state.data[table] ?? [], error: state.failed === table ? { message: 'Unavailable' } : null }).then(resolve),
  }; return q;
} }) }));
import { convertToCSV, exportCourses, exportGrades, exportEnrollments, EXPORT_TEMPLATES } from '@/lib/dataExport';
beforeEach(() => {
  state.failed = '';
  state.data = {
    lms_courses: [{ id: 'course', title: 'Training', program_id: 'program', duration: 20 }],
    programs: [{ id: 'program', title: 'Program', category: 'Trades', tuition: null }],
    instructor_assignments: [{ course_id: 'course', instructor_id: 'person' }],
    profiles: [{ id: 'person', full_name: 'Recorded Person', email: 'person@example.invalid' }],
    assignments: [{ id: 'assignment', title: 'Safety', max_points: 100, course_id: 'course' }],
    assignment_submissions: [{ id: 'submission', user_id: 'person', assignment_id: 'assignment', grade: 0 }],
    program_enrollments: [{ id: 'enrollment', user_id: 'person', course_id: 'course', program_id: 'program', progress: 25 }],
  };
});
it('exports connected instructors and leaves unrecorded pricing blank', async () => {
  const rows = await exportCourses();
  expect(rows[0]).toMatchObject({ instructor_name: 'Recorded Person', category: 'Trades', price: null, level: null });
  expect(() => convertToCSV(rows, EXPORT_TEMPLATES.courses.columns)).not.toThrow();
});
it('retains zero grades and resolves actual student, assignment and course records', async () => {
  expect((await exportGrades())[0]).toMatchObject({ student_name: 'Recorded Person', grade: 0, assignment_points: 100, course_title: 'Training' });
  expect((await exportEnrollments())[0]).toMatchObject({ student_name: 'Recorded Person', course_title: 'Training', course_category: 'Trades', progress: 25 });
});
it('does not emit a partial export after a related-record read fails', async () => {
  state.failed = 'profiles';
  await expect(exportGrades()).rejects.toBeTruthy();
});
it('escapes spreadsheet formulas while preserving numeric values and CSV quoting', () => {
  expect(convertToCSV([{ name: '=HYPERLINK("bad")', amount: -10 }])).toContain('"\'=HYPERLINK(""bad"")",-10');
});
