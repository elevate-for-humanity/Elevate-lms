import 'server-only';

/**
 * Canonical participant 360 read model.
 *
 * This service does not create a second participant identity. It resolves an
 * application to the existing profile/user record (preferring immutable
 * user_id over email) and projects the operational records already owned by
 * their respective canonical tables. Callers remain responsible for checking
 * record/organization authorization before invoking this loader.
 */

type DbClient = any;

type SourceResult<T> = { data: T; error?: string };

export type Participant360 = {
  application: any;
  profile: any | null;
  learnerId: string | null;
  enrollments: any[];
  credentials: any[];
  placements: any[];
  wioa: any | null;
  documents: any[];
  caseNotes: any[];
  fundingAssignments: any[];
  activity: any[];
  communications: any[];
  apprenticeshipEnrollments: any[];
  sourceErrors: Record<string, string>;
};

async function rows<T = any[]>(source: string, promise: PromiseLike<any>): Promise<[string, SourceResult<T>]> {
  try {
    const result = await promise;
    if (result?.error) return [source, { data: [] as T, error: result.error.message || String(result.error) }];
    return [source, { data: (result?.data ?? []) as T }];
  } catch (error) {
    return [source, { data: [] as T, error: error instanceof Error ? error.message : String(error) }];
  }
}

async function one<T = any | null>(source: string, promise: PromiseLike<any>): Promise<[string, SourceResult<T>]> {
  try {
    const result = await promise;
    if (result?.error) return [source, { data: null as T, error: result.error.message || String(result.error) }];
    return [source, { data: (result?.data ?? null) as T }];
  } catch (error) {
    return [source, { data: null as T, error: error instanceof Error ? error.message : String(error) }];
  }
}

export async function loadParticipant360ByApplication(
  db: DbClient,
  applicationId: string,
): Promise<Participant360 | null> {
  const { data: application, error: applicationError } = await db
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle();

  if (applicationError) throw applicationError;
  if (!application) return null;

  let profile: any | null = null;
  if (application.user_id) {
    const { data, error } = await db.from('profiles').select('*').eq('id', application.user_id).maybeSingle();
    if (error) throw error;
    profile = data ?? null;
  }
  if (!profile && application.email) {
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .ilike('email', String(application.email))
      .maybeSingle();
    if (error) throw error;
    profile = data ?? null;
  }

  const learnerId = profile?.id ?? application.user_id ?? null;
  const empty: Participant360 = {
    application,
    profile,
    learnerId,
    enrollments: [],
    credentials: [],
    placements: [],
    wioa: null,
    documents: [],
    caseNotes: [],
    fundingAssignments: [],
    activity: [],
    communications: [],
    apprenticeshipEnrollments: [],
    sourceErrors: {},
  };
  if (!learnerId) return empty;

  const enrollmentResult = await rows('program_enrollments', db
    .from('program_enrollments')
    .select('*, programs:program_id(id,name,title,slug)')
    .eq('user_id', learnerId)
    .order('enrolled_at', { ascending: false }));

  const enrollments = (enrollmentResult[1].data ?? []) as any[];
  const enrollmentIds = enrollments.map((row: any) => row.id).filter(Boolean);

  const requests: Array<Promise<[string, SourceResult<any>]>> = [
    Promise.resolve(enrollmentResult),
    rows('credentials', db.from('credentials').select('*').eq('user_id', learnerId).order('issued_date', { ascending: false })),
    rows('placement_records', db.from('placement_records').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false })),
    one('wioa_participants', db.from('wioa_participants').select('*').eq('user_id', learnerId).maybeSingle()),
    rows('documents', db.from('documents').select('*').eq('user_id', learnerId).order('created_at', { ascending: false })),
    rows('case_notes', db.from('case_notes').select('*').eq('student_id', learnerId).order('created_at', { ascending: false })),
    rows('communication_messages', db.from('communication_messages').select('*').eq('recipient_user_id', learnerId).order('created_at', { ascending: false }).limit(100)),
    rows('apprenticeship_enrollments', db.from('apprenticeship_enrollments').select('*').eq('student_id', learnerId).order('created_at', { ascending: false })),
  ];

  if (enrollmentIds.length) {
    requests.push(
      rows('student_funding_assignments', db.from('student_funding_assignments').select('*, funding_sources(*)').in('enrollment_id', enrollmentIds)),
      rows('student_activity_log', db.from('student_activity_log').select('*').in('enrollment_id', enrollmentIds).order('created_at', { ascending: false }).limit(100)),
    );
  }

  const results = Object.fromEntries(await Promise.all(requests)) as Record<string, SourceResult<any>>;
  const sourceErrors = Object.fromEntries(
    Object.entries(results).filter(([, value]) => value.error).map(([key, value]) => [key, value.error as string]),
  );

  return {
    application,
    profile,
    learnerId,
    enrollments,
    credentials: results.credentials?.data ?? [],
    placements: results.placement_records?.data ?? [],
    wioa: results.wioa_participants?.data ?? null,
    documents: results.documents?.data ?? [],
    caseNotes: results.case_notes?.data ?? [],
    fundingAssignments: results.student_funding_assignments?.data ?? [],
    activity: results.student_activity_log?.data ?? [],
    communications: results.communication_messages?.data ?? [],
    apprenticeshipEnrollments: results.apprenticeship_enrollments?.data ?? [],
    sourceErrors,
  };
}
