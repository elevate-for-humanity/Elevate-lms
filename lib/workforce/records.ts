export const WORKFORCE_ACCESS_ROLES = [
  'admin',
  'super_admin',
  'staff',
  'org_admin',
  'case_manager',
  'workforce_partner',
] as const;

export function isPlatformOversight(roles: readonly string[]) {
  return roles.some((role) => role === 'admin' || role === 'super_admin');
}

export function learnerId(row: { user_id?: string | null; student_id?: string | null }) {
  return row.user_id || row.student_id || null;
}

export function filterEnrollments<T extends { enrollment_state?: string; at_risk?: boolean }>(
  rows: T[],
  filter?: string,
) {
  if (filter === 'at-risk') return rows.filter((row) => row.at_risk === true);
  if (filter === 'active' || filter === 'completed')
    return rows.filter((row) => row.enrollment_state === filter);
  return rows;
}

export function enrollmentSummary(
  rows: Array<{
    user_id?: string | null;
    student_id?: string | null;
    enrollment_state?: string;
    at_risk?: boolean;
  }>,
) {
  return {
    participants: new Set(rows.map(learnerId).filter(Boolean)).size,
    enrollments: rows.length,
    active: filterEnrollments(rows, 'active').length,
    completed: filterEnrollments(rows, 'completed').length,
    atRisk: filterEnrollments(rows, 'at-risk').length,
  };
}

// Quote all cells and neutralize spreadsheet formulas in user-entered fields.
export function csvCell(value: unknown) {
  let text = value == null ? '' : String(value);
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
