import { resolveCourseIdFromDb } from '@/lib/course-builder/program-resolver';

export type EnrollmentSource = 'program_enrollments';

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

export interface ResolveEnrollmentOptions {
  client: any;
  userId: string;
  prefer?: EnrollmentSource;
  programSlug?: string;
  enrollmentId?: string;
}

function toMillis(value: string | null): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

async function requireEnrollmentOwner(client: any, userId: string) {
  const { data } = await client.auth.getUser();
  if (!data?.user || data.user.id !== userId) throw new Error('Unauthorized');
}

function formatSlugTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function normalizeProgramEnrollment(row: any): ResolvedEnrollment {
  const program = Array.isArray(row?.programs) ? (row.programs[0] ?? null) : row?.programs;
  const programSlug = row.program_slug ?? program?.slug ?? null;
  const programTitle =
    program?.title ?? program?.name ?? (programSlug ? formatSlugTitle(programSlug) : null);

  const rawStatus = row.status ?? 'pending';
  const rawState = row.enrollment_state ?? null;

  // Pending approval is not authorization to access courses.

  const courseId = row.course_id ?? null;

  return {
    id: row.id,
    source: 'program_enrollments',
    userId: row.user_id ?? row.student_id,
    status: rawStatus,
    enrollmentState: rawState,
    programSlug,
    programTitle,
    courseId,
    progress: Number(row.progress_percent ?? row.progress ?? 0),
    orientationCompletedAt: row.orientation_completed_at ?? null,
    documentsSubmittedAt: row.documents_submitted_at ?? null,
    accessGrantedAt: row.access_granted_at ?? null,
    createdAt: row.created_at ?? row.enrolled_at ?? null,
  };
}

export async function resolveLatestEnrollment({
  client,
  userId,
  programSlug,
  enrollmentId,
}: ResolveEnrollmentOptions): Promise<ResolvedEnrollment | null> {
  await requireEnrollmentOwner(client, userId);

  let query = client
    .from('program_enrollments')
    .select(
      'id, user_id, student_id, status, enrollment_state, program_slug, program_id, course_id, progress_percent, orientation_completed_at, documents_submitted_at, access_granted_at, created_at, enrolled_at, programs:program_id(slug, title, name)',
    )
    .or(`user_id.eq.${userId},student_id.eq.${userId}`);

  if (enrollmentId) {
    query = query.eq('id', enrollmentId);
    const { data, error } = await query.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const resolved = normalizeProgramEnrollment(data);
    if (!resolved.courseId && resolved.programSlug) {
      resolved.courseId = await resolveCourseIdFromDb(client, resolved.programSlug);
    }
    return resolved;
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(20);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const normalized = data.map(normalizeProgramEnrollment);

  // If a specific program slug was requested, match against it
  let candidate: ResolvedEnrollment | undefined;
  if (programSlug) {
    const target = programSlug.toLowerCase().trim();
    candidate = normalized.find((e) => e.programSlug?.toLowerCase().trim() === target);
  }

  if (!candidate) {
    // Prioritize active / enrolled states over pending or withdrawn
    const activeStates = [
      'active',
      'enrolled',
      'in_progress',
      'confirmed',
      'orientation_complete',
      'documents_complete',
    ];
    candidate = normalized.find((e) =>
      activeStates.includes(String(e.enrollmentState || e.status).toLowerCase()),
    );
  }

  const finalEnrollment = candidate ?? normalized[0];

  // If courseId is missing but programSlug is present, attempt canonical course resolution
  if (finalEnrollment && !finalEnrollment.courseId && finalEnrollment.programSlug) {
    finalEnrollment.courseId = await resolveCourseIdFromDb(client, finalEnrollment.programSlug);
  }

  return finalEnrollment;
}

export async function listUnifiedEnrollments(
  client: any,
  userId: string,
  limit = 10,
): Promise<ResolvedEnrollment[]> {
  await requireEnrollmentOwner(client, userId);
  const programResp = await client
    .from('program_enrollments')
    .select(
      'id, user_id, student_id, status, enrollment_state, program_slug, program_id, course_id, progress_percent, orientation_completed_at, documents_submitted_at, access_granted_at, created_at, enrolled_at, programs:program_id(slug, title, name)',
    )
    .or(`user_id.eq.${userId},student_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  const normalized = (programResp.data ?? []).map(normalizeProgramEnrollment);

  return normalized.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

// Enrollment states that grant LMS access — mirrors LMS_ACCESS_STATES in proxy.ts.
// 'active' covers legacy backfill rows; 'enrolled' covers new program_enrollments.
export const ACCESS_STATES = new Set(['active', 'enrolled']);

export function hasLmsAccess(enrollment: ResolvedEnrollment | null): boolean {
  if (!enrollment) return false;
  // Access must be explicitly granted.
  // A status label alone cannot authorize LMS access.
  if (!enrollment.accessGrantedAt) return false;

  const blocked = new Set(['withdrawn', 'revoked', 'rejected', 'suspended']);

  return !blocked.has(String(enrollment.enrollmentState ?? enrollment.status).toLowerCase());
}
