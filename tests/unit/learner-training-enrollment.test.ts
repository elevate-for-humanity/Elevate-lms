import { describe, expect, it } from 'vitest';
import { selectTrainingEnrollment } from '@/lib/learner/training-enrollment';

const registration = { source_table: 'program_enrollments' as const, course_id: null, status: 'active' };
const internal = { source_table: 'course_enrollments' as const, course_id: 'internal-course', status: 'active' };
const partner = { source_table: 'partner_lms_enrollments' as const, course_id: 'partner-course', status: 'in_progress' };

describe('learner instructional assignment', () => {
  it('does not mark a program-only or unassigned partner registration complete', () => {
    expect(selectTrainingEnrollment([registration, { ...partner, course_id: null }])).toBeNull();
  });
  it('finds an assigned internal course behind a more recent program-only registration', () => {
    expect(selectTrainingEnrollment([registration, internal])).toBe(internal);
  });
  it('retains the assigned partner course preference without reordering enrollments', () => {
    const enrollments = Object.freeze([internal, partner]);
    expect(selectTrainingEnrollment(enrollments)).toBe(partner);
    expect(enrollments[0]).toBe(internal);
  });
  it('does not use pending, cancelled or withdrawn course records as active assignments', () => {
    for (const status of ['pending', 'cancelled', 'withdrawn']) {
      expect(selectTrainingEnrollment([{ ...internal, status }])).toBeNull();
    }
  });
  it('keeps completed course assignments and prefers a current active assignment', () => {
    const completed = { ...partner, status: 'completed' };
    expect(selectTrainingEnrollment([completed])).toBe(completed);
    expect(selectTrainingEnrollment([completed, internal])).toBe(internal);
  });
});
