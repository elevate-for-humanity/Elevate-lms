/** Report-only classification. Never use QA labels to grant or deny portal access.
 * A profile is synthetic only if it has one or more program enrollments and
 * every associated enrollment has an explicit QA marker.
 */
export type EnrollmentQaMarker = {
  user_id: string | null;
  student_id: string | null;
  payment_status: string | null;
  funding_source: string | null;
};

export function isSyntheticQaEnrollment(row: EnrollmentQaMarker): boolean {
  return row.payment_status === 'qa_test' || row.funding_source === 'qa-e2e';
}

export function syntheticQaProfileIds(rows: EnrollmentQaMarker[]): Set<string> {
  const byProfile = new Map<string, { total: number; synthetic: number }>();
  for (const row of rows) {
    const ids = new Set([row.user_id, row.student_id].filter((id): id is string => Boolean(id)));
    for (const id of ids) {
      const current = byProfile.get(id) ?? { total: 0, synthetic: 0 };
      current.total += 1;
      if (isSyntheticQaEnrollment(row)) current.synthetic += 1;
      byProfile.set(id, current);
    }
  }
  return new Set([...byProfile].filter(([, v]) => v.total > 0 && v.total === v.synthetic).map(([id]) => id));
}
