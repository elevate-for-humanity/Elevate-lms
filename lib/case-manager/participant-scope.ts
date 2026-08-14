type DbClient = any;

type CaseManagerScopeInput = {
  db: DbClient;
  userId: string;
  effectiveRoles?: readonly string[];
};

export type CaseManagerParticipant = {
  application: any;
  learnerProfile: any | null;
  learnerId: string | null;
};

export function hasCaseManagerOversight(effectiveRoles: readonly string[] = []) {
  return effectiveRoles.includes('admin') || effectiveRoles.includes('super_admin');
}

export async function getCaseManagerApplicationIds({
  db,
  userId,
  effectiveRoles = [],
}: CaseManagerScopeInput): Promise<string[] | null> {
  if (hasCaseManagerOversight(effectiveRoles)) return null;

  const { data, error } = await db
    .from('case_manager_assignments')
    .select('application_id')
    .eq('case_manager_id', userId);

  if (error) throw error;

  return [...new Set((data ?? []).map((row: any) => row.application_id).filter(Boolean))] as string[];
}

export async function resolveCaseManagerParticipant(
  applicationId: string,
  { db, userId, effectiveRoles = [] }: CaseManagerScopeInput,
): Promise<CaseManagerParticipant | null> {
  if (!hasCaseManagerOversight(effectiveRoles)) {
    const { data: assignment, error: assignmentError } = await db
      .from('case_manager_assignments')
      .select('application_id')
      .eq('case_manager_id', userId)
      .eq('application_id', applicationId)
      .maybeSingle();

    if (assignmentError) throw assignmentError;
    if (!assignment) return null;
  }

  const { data: application, error: applicationError } = await db
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle();

  if (applicationError) throw applicationError;
  if (!application) return null;

  let learnerProfile: any | null = null;
  if (application.email) {
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .ilike('email', application.email)
      .maybeSingle();

    if (error) throw error;
    learnerProfile = data ?? null;
  }

  return {
    application,
    learnerProfile,
    learnerId: learnerProfile?.id ?? null,
  };
}

export async function getCaseManagerParticipants({
  db,
  userId,
  effectiveRoles = [],
}: CaseManagerScopeInput): Promise<CaseManagerParticipant[]> {
  const applicationIds = await getCaseManagerApplicationIds({ db, userId, effectiveRoles });

  let query = db.from('applications').select('*').order('last_name', { ascending: true });
  if (applicationIds !== null) {
    if (applicationIds.length === 0) return [];
    query = query.in('id', applicationIds);
  }

  const { data: applications, error } = await query;
  if (error) throw error;

  const emails = [...new Set((applications ?? []).map((row: any) => row.email).filter(Boolean))] as string[];
  const profilesByEmail = new Map<string, any>();

  if (emails.length > 0) {
    const { data: profiles, error: profilesError } = await db
      .from('profiles')
      .select('*')
      .in('email', emails);

    if (profilesError) throw profilesError;
    for (const profile of profiles ?? []) {
      if (profile.email) profilesByEmail.set(String(profile.email).toLowerCase(), profile);
    }
  }

  return (applications ?? []).map((application: any) => {
    const learnerProfile = application.email
      ? profilesByEmail.get(String(application.email).toLowerCase()) ?? null
      : null;
    return {
      application,
      learnerProfile,
      learnerId: learnerProfile?.id ?? null,
    };
  });
}
