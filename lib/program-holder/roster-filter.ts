type RosterStudent = {
  full_name?: string | null;
  email?: string | null;
  status?: string | null;
  enrollment_state?: string | null;
};
/** Filter only the already-authorized roster; URL parameters never widen access. */
export function filterHolderStudents<T extends RosterStudent>(
  rows: T[],
  query = '',
  status = 'all',
): T[] {
  const needle = query.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    const state = String(row.enrollment_state || row.status || '').toLowerCase();
    const matchesStatus =
      status === 'active'
        ? ['active', 'enrolled', 'in_progress', 'confirmed'].includes(state)
        : status === 'completed'
          ? ['completed', 'graduated'].includes(state)
          : true;
    return (
      matchesStatus &&
      (!needle || `${row.full_name || ''} ${row.email || ''}`.toLocaleLowerCase().includes(needle))
    );
  });
}
