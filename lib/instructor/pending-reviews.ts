/** Caller must authorize the instructor/admin and resolve assigned student IDs first. */
export async function loadInstructorPendingReviews(
  db: any,
  scope: { isAdmin: boolean; studentIds: string[] },
) {
  const ids = [...new Set(scope.studentIds.filter(Boolean))];
  if (!scope.isAdmin && ids.length === 0) {
    return { pendingOjtResult: { data: [], error: null }, pendingSignoffsResult: { data: [], error: null } };
  }
  let ojt = db.from('competency_log')
    .select('id, created_at, notes, student_id:apprentice_id')
    .eq('supervisor_verified', false);
  let signoffs = db.from('barber_instructor_signoffs')
    .select('id, signoff_type, created_at:signed_at, student_id:user_id')
    .eq('status', 'pending');
  if (!scope.isAdmin) {
    ojt = ojt.in('apprentice_id', ids);
    signoffs = signoffs.in('user_id', ids);
  }
  const [pendingOjtResult, pendingSignoffsResult] = await Promise.all([
    ojt.order('created_at', { ascending: false }).limit(10),
    signoffs.order('signed_at', { ascending: false }).limit(10),
  ]);
  return { pendingOjtResult, pendingSignoffsResult };
}
