/** Count verified clocks once, within the student's assigned program. */
export function verifiedTrainingForEnrollment(enrollment: { user_id?: string; program_id?: string; program_slug?: string }, hours: any[], progress: any[]) {
  let total = 0;
  let firstDate: string | null = null;
  const mirrored = new Set<string>(), countedHours = new Set<string>(), countedProgress = new Set<string>();
  const add = (amount: unknown, date: unknown) => { const value = Number(amount); if (!Number.isFinite(value) || value <= 0) return; total += value; if (typeof date === 'string' && (!firstDate || date < firstDate)) firstDate = date; };
  if (!enrollment.user_id) return { total, firstDate };
  for (const row of hours) {
    if (row.user_id !== enrollment.user_id || !enrollment.program_slug || row.program_slug !== enrollment.program_slug || !['approved','verified','complete','completed'].includes(String(row.approval_status || row.status).toLowerCase()) || countedHours.has(row.id)) continue;
    countedHours.add(row.id); if (row.progress_entry_id) mirrored.add(row.progress_entry_id);
    add(row.accepted_hours ?? row.hours_claimed ?? row.hours, row.work_date);
  }
  for (const row of progress) {
    if (row.apprentice_id !== enrollment.user_id || row.program_id !== enrollment.program_id || row.status !== 'verified' || mirrored.has(row.id) || countedProgress.has(row.id) || (row.hour_entry_id && countedHours.has(row.hour_entry_id))) continue;
    countedProgress.add(row.id); add(row.hours_worked, row.work_date);
  }
  return { total, firstDate };
}
