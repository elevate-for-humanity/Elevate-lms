import type { NormalizedEnrollment } from '@/lib/enrollments/getUserEnrollments';

type Assignment = Pick<NormalizedEnrollment, 'source_table' | 'course_id' | 'status'>;

/** A program registration alone is not an instructional course assignment. */
export function selectTrainingEnrollment<T extends Assignment>(enrollments: readonly T[]): T | null {
  const active = enrollments.filter(row =>
    Boolean(row.course_id) && ['active', 'enrolled', 'in_progress'].includes(row.status.toLowerCase()),
  );
  return active.find(row => row.source_table === 'partner_lms_enrollments') ?? active[0] ??
    enrollments.find(row => Boolean(row.course_id) && row.status.toLowerCase() === 'completed') ?? null;
}
