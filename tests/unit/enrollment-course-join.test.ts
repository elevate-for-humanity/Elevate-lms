import { describe, it, expect, vi } from 'vitest';
import { attachLmsCoursesToEnrollments } from '@/lib/db/enrollment-course-join';

describe('attachLmsCoursesToEnrollments', () => {
  it('returns rows with null course when no course_id', async () => {
    const supabase = {
      from: vi.fn(),
    } as any;
    const rows = [{ id: 'e1', course_id: null }];
    const result = await attachLmsCoursesToEnrollments(supabase, rows);
    expect(result[0].course).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('maps lms_courses by id', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(async () => ({
            data: [{ id: 'c1', course_name: 'HVAC', title: 'HVAC Tech' }],
            error: null,
          })),
        })),
      })),
    } as any;

    const result = await attachLmsCoursesToEnrollments(supabase, [
      { id: 'e1', course_id: 'c1' },
    ]);

    expect(result[0].course?.course_name).toBe('HVAC');
  });
});
