/** Read the same saved sessions as learner Attendance, scoped to this holder's roster. */
export async function loadHolderOnlineStudy(db: any, enrollments: any[]) {
  const roster = new Map(
    enrollments.filter((row) => row.id && row.user_id).map((row) => [row.id, row.user_id]),
  );
  if (!roster.size) return [];
  const { data, error } = await db
    .from('hvac_hands_on_sessions')
    .select(
      'id,user_id,enrollment_id,clock_in_at,clock_out_at,attendance_hours(id,hours_logged,verified,verified_at)',
    )
    .in('enrollment_id', [...roster.keys()])
    .order('clock_in_at', { ascending: false })
    .limit(2000);
  if (error) throw new Error('Program Holder hands-on training clocks could not load.');
  return (data ?? []).filter(
    (session: any) => roster.get(session.enrollment_id) === session.user_id,
  );
}
