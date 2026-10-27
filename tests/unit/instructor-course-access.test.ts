import { describe, expect, it, vi } from 'vitest';
import { isAssignedCourseInstructor } from '@/lib/lms/instructor-course-access';
function database(data: unknown, error: unknown = null) {
  const filters: unknown[][] = [];
  const query: any = { select: vi.fn(() => query), eq: (column: string, value: unknown) => { filters.push([column, value]); return query; }, limit: () => query, maybeSingle: async () => ({ data, error }) };
  return { filters, from: vi.fn(() => query) };
}
describe('instructor assignment authorization', () => {
  it('requires an active assignment for the exact actor and course', async () => {
    const db = database({ id: 'assignment' });
    expect(await isAssignedCourseInstructor(db as any, 'instructor', 'course')).toBe(true);
    expect(db.from).toHaveBeenCalledWith('instructor_assignments');
    expect(db.filters).toEqual([['instructor_id', 'instructor'], ['course_id', 'course'], ['active', true]]);
  });
  it('denies an unassigned instructor', async () => {
    expect(await isAssignedCourseInstructor(database(null) as any, 'other', 'course')).toBe(false);
  });
  it('surfaces database outages without granting access', async () => {
    await expect(isAssignedCourseInstructor(database(null, { message: 'offline' }) as any, 'instructor', 'course')).rejects.toThrow('Instructor assignment unavailable');
  });
});
