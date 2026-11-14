export type JriReportRow = {
  enrollment_id: string; participant_id: string | null; full_name: string | null; email: string | null;
  program_title: string | null; enrollment_status: string; enrolled_at: string | null; placement_status: string | null;
};

export function summarizeJriReport(rows: JriReportRow[]) {
  const enrollments = [...new Map(rows.map(row => [row.enrollment_id, row])).values()];
  const learnerIds = new Set(enrollments.map(row => row.participant_id).filter(Boolean));
  const employedIds = new Set(enrollments.filter(row => row.placement_status === 'verified').map(row => row.participant_id).filter(Boolean));
  const completed = enrollments.filter(row => row.enrollment_status === 'completed').length;
  return {
    enrollments, total: enrollments.length, learners: learnerIds.size,
    active: enrollments.filter(row => ['active', 'enrolled', 'in_progress', 'confirmed'].includes(row.enrollment_status)).length,
    completed, employed: employedIds.size,
    completionRate: enrollments.length ? Math.round(completed / enrollments.length * 100) : 0,
    placementRate: learnerIds.size ? Math.round(employedIds.size / learnerIds.size * 100) : 0,
  };
}
