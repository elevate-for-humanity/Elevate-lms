/** Explicit disclosure contract. New database fields are private by default. */
const TRAINING_FIELDS = [
  'id', 'user_id', 'full_name', 'email', 'phone', 'applicant_name', 'applicant_email',
  'applicant_phone', 'status', 'application_status', 'enrollment_state', 'program_id',
  'program_slug', 'enrolled_at', 'progress_percent', 'at_risk', 'next_required_action',
  'training_start_date', 'training_end_date', 'expected_end_date', 'student_start_date',
  'start_date', 'completion_date', 'completed_at', 'total_hours_completed', 'lms_completed',
  'practical_skills_verified', 'roster_source', 'enrollment_id', 'work_start_date',
  'work_progress', 'hours_taught', 'hours_required', 'work_site', 'updated_at',
] as const;

export function holderTrainingRecord(row: Record<string, unknown>): Record<string, any> {
  return Object.fromEntries(TRAINING_FIELDS.filter(key => Object.hasOwn(row, key)).map(key => [key, row[key]]));
}

export function completionAlert(row: Record<string, any>, today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())): string | null {
  if (row.completion_date || row.completed_at) return null;
  if (['completed', 'graduated'].includes(String(row.status || row.enrollment_state).toLowerCase()))
    return 'Actual completion date needs documentation';
  const expected = row.expected_end_date || row.training_end_date;
  if (!expected) return 'Expected completion date missing';
  const days = Math.round((Date.parse(String(expected).slice(0, 10) + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);
  if (!Number.isFinite(days)) return 'Expected completion date needs review';
  if (days < 0) return 'Completion overdue — confirm progress';
  if (days === 0) return 'Completion due today';
  if (days <= 7) return 'Completion due within 7 days';
  if (days <= 14) return 'Completion due within 14 days';
  if (days <= 30) return 'Completion due within 30 days';
  return null;
}
