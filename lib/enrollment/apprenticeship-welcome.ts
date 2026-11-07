export async function queueApprenticeshipWelcome(db: any, input: {enrollmentId: string; email: string; name: string; programName: string}) {
  const {error} = await db.from('notification_outbox').upsert({
    notification_key: 'apprenticeship-welcome:' + input.enrollmentId,
    to_email: input.email,
    template_key: 'enrollment_welcome',
    template_data: {
      name: input.name, email: input.email, username: input.email,
      program_name: input.programName,
      dashboard_url: 'https://app.elevateforhumanity.org/apprentice',
      login_url: 'https://app.elevateforhumanity.org/login',
      password_setup_url: 'https://app.elevateforhumanity.org/forgot-password',
      security_url: 'https://app.elevateforhumanity.org/account/settings/security',
    },
    entity_type: 'program_enrollment', entity_id: input.enrollmentId,
  }, {onConflict: 'notification_key', ignoreDuplicates: true});
  if (error) throw new Error('Apprenticeship welcome could not be queued.');
}
