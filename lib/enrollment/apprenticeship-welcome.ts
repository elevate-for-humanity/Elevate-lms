/** Both paid checkout paths share one verified, idempotent welcome. */
export async function queueApprenticeshipWelcome(db: any, input: {enrollmentId: string; email: string; name: string; programName: string}) {
  await queuePaidProgramWelcome(db, input.enrollmentId);
}

/** Send only after the paid enrollment is persisted and active. */
export async function queuePaidProgramWelcome(db: any, enrollmentId: string) {
  const enrollment = await db.from('program_enrollments')
    .select('id,user_id,student_id,program_id,program_slug,status,payment_status')
    .eq('id', enrollmentId).maybeSingle();
  if (enrollment.error || enrollment.data?.status !== 'active' || enrollment.data?.payment_status !== 'paid')
    throw new Error('Active paid enrollment could not be verified for welcome.');
  const row = enrollment.data;
  const [profile, program] = await Promise.all([
    db.from('profiles').select('email,full_name').eq('id', row.user_id || row.student_id).maybeSingle(),
    db.from('programs').select('title,is_apprenticeship').eq('id', row.program_id).maybeSingle(),
  ]);
  if (profile.error || program.error || !profile.data?.email || !program.data)
    throw new Error('Paid enrollment welcome recipient could not be verified.');
  const apprentice = program.data.is_apprenticeship === true || /apprentice/i.test(row.program_slug || '');
  // Preserve any legacy queued/sent welcome; never replay it under the new key.
  const legacy = await db.from('notification_outbox').select('id')
    .eq('notification_key', 'apprenticeship-welcome:' + enrollmentId).maybeSingle();
  if (legacy.error) throw new Error('Existing enrollment welcome could not be verified.');
  if (legacy.data?.id) return;
  const {error} = await db.from('notification_outbox').upsert({
    notification_key: 'paid-program-welcome:' + enrollmentId,
    to_email: profile.data.email, template_key: 'enrollment_welcome',
    template_data: {
      name: profile.data.full_name || 'Learner', email: profile.data.email,
      username: profile.data.email, program_name: program.data.title,
      dashboard_url: 'https://app.elevateforhumanity.org/' + (apprentice ? 'apprentice' : 'learner/dashboard'),
      login_url: 'https://app.elevateforhumanity.org/login',
      password_setup_url: 'https://app.elevateforhumanity.org/forgot-password',
    }, entity_type: 'program_enrollment', entity_id: enrollmentId,
  }, {onConflict: 'notification_key', ignoreDuplicates: true});
  if(error) throw new Error('Paid program welcome could not be queued.');
}
