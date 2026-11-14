/** Identity matching is used only after the caller scopes both lists to an authorized holder. */
export type LearnerProgramRecord = {
  user_id?: string | null; student_id?: string | null; program_id?: string | null;
  program_holder_id?: string | null; status?: string | null; revoked_at?: string | null;
};
export function learnerProgramKey(row: LearnerProgramRecord): string | null {
  if (row.user_id && row.student_id && row.user_id !== row.student_id) return null;
  const learner = row.user_id || row.student_id;
  if (!learner || !row.program_id || !row.program_holder_id) return null;
  return JSON.stringify([learner, row.program_id, row.program_holder_id]);
}
export function hasActiveProgramEnrollment(applicant: LearnerProgramRecord, enrollments: LearnerProgramRecord[]): boolean {
  const key = learnerProgramKey(applicant);
  return Boolean(key && enrollments.some(row => !row.revoked_at &&
    ['active', 'enrolled', 'in_progress'].includes(String(row.status)) && learnerProgramKey(row) === key));
}
/** The approved program catalog currently assigns EPA 608 readiness to this pathway. */
export function isEpaTestingProgram(slug: unknown): boolean {
  return typeof slug === 'string' && slug.trim().toLowerCase() === 'hvac-technician';
}
