import type { NormalizedEnrollment } from '@/lib/enrollments/getUserEnrollments';

type Assignment = Pick<NormalizedEnrollment, 'source_table' | 'course_id' | 'status'> & { assignment_kind?: string };

/** A program registration alone is not an instructional course assignment. */
export function selectTrainingEnrollment<T extends Assignment>(enrollments: readonly T[]): T | null {
  const primary = enrollments.filter(row => row.assignment_kind !== 'secondary');
  const active = primary.filter(row =>
    Boolean(row.course_id) && ['active', 'enrolled', 'in_progress'].includes(row.status.toLowerCase()),
  );
  return active.find(row => row.source_table === 'partner_lms_enrollments') ?? active[0] ??
    primary.find(row => Boolean(row.course_id) && row.status.toLowerCase() === 'completed') ?? null;
}
