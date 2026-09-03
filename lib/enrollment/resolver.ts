export type EnrollmentSource = 'program_enrollments' | 'training_enrollments';

export interface ResolvedEnrollment {
  id: string;
  source: EnrollmentSource;
  userId: string;
  status: string;
  enrollmentState: string | null;
  programSlug: string | null;
  programTitle: string | null;
  courseId: string | null;
  progress: number;
  orientationCompletedAt: string | null;
  documentsSubmittedAt: string | null;
  accessGrantedAt: string | null;
  createdAt: string | null;
}

interface ResolveEnrollmentOptions {
  client: any;
  userId: string;
  prefer?: EnrollmentSource;
}

function toMillis(value: string | null): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

function normalizeProgramEnrollment(row: any): ResolvedEnrollment {
  const program = Array.isArray(row?.programs) ? (row.programs[0] ?? null) : row?.programs;
  return {
    id: row.id,
    source: 'program_enrollments',
    userId: row.user_id,
    status: row.status ?? 'pending',
    enrollmentState: row.enrollment_state ?? null,
    programSlug: row.program_slug ?? program?.slug ?? null,
    programTitle: program?.title ?? program?.name ?? null,
    courseId: row.course_id ?? null,
    progress: Number(row.progress_percent ?? row.progress ?? 0),
    orientationCompletedAt: row.orientation_completed_at ?? null,
    documentsSubmittedAt: row.documents_submitted_at ?? null,
    accessGrantedAt: row.access_granted_at ?? null,
    createdAt: row.created_at ?? row.enrolled_at ?? null,
  };
}

function normalizeTrainingEnrollment(row: any): ResolvedEnrollment {
  const program = Array.isArray(row?.programs) ? (row.programs[0] ?? null) : row?.programs;
  return {
    id: row.id,
    source: 'training_enrollments',
    userId: row.user_id,
    status: row.status ?? 'pending',
    enrollmentState: null,
    programSlug: program?.slug ?? null,
    programTitle: program?.title ?? program?.name ?? null,
    courseId: row.course_id ?? null,
    progress: Number(row.progress_percent ?? 0),
    orientationCompletedAt: row.orientation_completed_at ?? null,
    documentsSubmittedAt: row.documents_submitted_at ?? null,
    accessGrantedAt: row.approved_at ?? null,
    createdAt: row.created_at ?? row.enrolled_at ?? null,
  };
}

export async function resolveLatestEnrollment({
  client,
  userId,
  prefer = 'program_enrollments',
}: ResolveEnrollmentOptions): Promise<ResolvedEnrollment | null> {
  const [programResp, trainingResp] = await Promise.all([
    client
      .from('program_enrollments')
      .select(
        'id, user_id, status, enrollment_state, program_slug, course_id, progress_percent, orientation_completed_at, documents_submitted_at, access_granted_at, created_at, enrolled_at, programs:program_id(slug, title, name)',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from('program_enrollments')
      .select(
        'id, user_id, status, course_id, progress_percent, orientation_completed_at, documents_submitted_at, created_at, enrolled_at, programs:program_id(slug, title, name)',
      )
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const normalizedProgram = programResp.data ? normalizeProgramEnrollment(programResp.data) : null;
  const normalizedTraining = trainingResp.data ? normalizeTrainingEnrollment(trainingResp.data) : null;

  if (!normalizedProgram && !normalizedTraining) return null;
  if (normalizedProgram && !normalizedTraining) return normalizedProgram;
  if (!normalizedProgram && normalizedTraining) return normalizedTraining;

  const programMillis = toMillis(normalizedProgram!.createdAt);
  const trainingMillis = toMillis(normalizedTraining!.createdAt);

  if (programMillis > trainingMillis) return normalizedProgram;
  if (trainingMillis > programMillis) return normalizedTraining;
  return prefer === 'program_enrollments' ? normalizedProgram : normalizedTraining;
}

export async function listUnifiedEnrollments(
  client: any,
  userId: string,
  limit = 10,
): Promise<ResolvedEnrollment[]> {
  const [programResp, trainingResp] = await Promise.all([
    client
      .from('program_enrollments')
      .select(
        'id, user_id, status, enrollment_state, program_slug, course_id, progress_percent, orientation_completed_at, documents_submitted_at, access_granted_at, created_at, enrolled_at, programs:program_id(slug, title, name)',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
    client
      .from('program_enrollments')
      .select(
        'id, user_id, status, course_id, progress_percent, orientation_completed_at, documents_submitted_at, created_at, enrolled_at, programs:program_id(slug, title, name)',
      )
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })
      .limit(limit),
  ]);

  const normalized = [
    ...(programResp.data ?? []).map(normalizeProgramEnrollment),
    ...(trainingResp.data ?? []).map(normalizeTrainingEnrollment),
  ];

  return normalized.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

// Enrollment states that grant LMS access — mirrors LMS_ACCESS_STATES in proxy.ts.
// 'active' covers legacy backfill rows; 'enrolled' covers new program_enrollments.
export const ACCESS_STATES = new Set(['active', 'enrolled']);

export function hasLmsAccess(enrollment: ResolvedEnrollment | null): boolean {
  if (!enrollment) return false;
  // Primary gate: access_granted_at set by admin or submit-documents route.
  if (enrollment.accessGrantedAt) return true;
  // Fallback: enrollment_state in ACCESS_STATES covers pre-fix rows and
  // training_enrollments where access_granted_at was never backfilled.
  return ACCESS_STATES.has(enrollment.enrollmentState ?? '') ||
    ACCESS_STATES.has(enrollment.status ?? '');
}
