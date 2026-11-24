const ISOLATED_QA_HOST = 'isdgjcdabhxxozarmxta.supabase.co';

/**
 * Give the isolated roster a representative learner profile without changing
 * its @qa.invalid Auth identity or the production roster's QA exclusions.
 * The profile-only address is reserved, cannot receive mail, and remains
 * visibly associated with this disposable QA run.
 */
export async function prepareQaHolderRosterProfile({ db, supabaseUrl, runId, userId }) {
  const url = new URL(supabaseUrl);
  if (url.protocol !== 'https:' || url.hostname !== ISOLATED_QA_HOST)
    throw new Error('Holder roster fixtures require the isolated QA project');
  if (!/^[a-z0-9-]+$/i.test(String(runId)) || typeof userId !== 'string' || !userId)
    throw new Error('Holder roster fixture identity is invalid');

  const marker = `qa-portal-e2e-${runId}`;
  const authEmail = `${marker}-holder-student@qa.invalid`;
  const { data: authData, error: authError } = await db.auth.admin.getUserById(userId);
  const user = authData?.user;
  if (
    authError || user?.id !== userId || user.email !== authEmail ||
    user.app_metadata?.qa_e2e !== true ||
    String(user.app_metadata?.qa_run_id) !== String(runId) ||
    user.app_metadata?.role !== 'student'
  ) throw new Error('Refusing to change a non-fixture holder student');

  const profile = {
    full_name: `Portal QA Holder Student ${runId}`,
    email: `${marker}-holder-student@roster.qa.invalid`,
  };
  const { data, error } = await db.from('profiles')
    .update(profile)
    .eq('id', userId)
    .eq('role', 'student')
    .eq('email', authEmail)
    .select('id,role,email,full_name')
    .single();
  if (error || data?.id !== userId || data.role !== 'student' ||
      data.email !== profile.email || data.full_name !== profile.full_name)
    throw new Error('Holder roster fixture profile could not be verified');
  return data;
}
