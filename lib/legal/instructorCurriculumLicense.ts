import 'server-only';
import { randomBytes } from 'node:crypto';
import { isAssignedCourseInstructor } from '@/lib/lms/instructor-course-access';

/**
 * Instructor curriculum IP license — server-side enforcement only.
 *
 * An instructor may access proprietary Elevate instructor content (the HVAC
 * course in a teaching capacity, its simulations as a demonstrator, teaching
 * workbook programs, and the instructor course workspace) only when ALL of
 * these hold:
 *
 *   1. Their profile role is 'instructor'.
 *   2. They signed the CURRENT version of the proprietary-curriculum IP
 *      agreement (agreement_type 'instructor_curriculum_ip'), recorded in
 *      license_agreement_acceptances. The older general
 *      'instructor_services' acceptance never satisfies this check.
 *   3. The published agreement hash matches the version pinned in code.
 *      A hash change under the same version fails closed.
 *   4. They hold an ACTIVE row in instructor_curriculum_licenses for that
 *      version (issued at signing, revocable by an admin).
 *   5. For a specific course, they hold an ACTIVE instructor_assignments
 *      row for that course (the existing scoped cohort/entitlement model).
 *
 * Students keep their existing enrollment-based access untouched: this
 * helper is only consulted for instructor-capacity access. Admins and staff
 * administer licenses; they do not teach through this gate.
 *
 * The agreement text is canonical in
 * docs/legal/instructor-curriculum-ip-agreement-v1.md (version 1.0, DRAFT
 * pending legal review). VERSION_HASHES pins its SHA-256 per version.
 */

export const INSTRUCTOR_CURRICULUM_IP_AGREEMENT_TYPE = 'instructor_curriculum_ip';
export const INSTRUCTOR_CURRICULUM_IP_DOCUMENT_URL =
  '/legal/instructor-curriculum-ip-agreement';

/** SHA-256 of docs/legal/instructor-curriculum-ip-agreement-v1.md, per version. */
export const INSTRUCTOR_CURRICULUM_IP_VERSION_HASHES: Record<string, string> = {
  '1.0': '46afcab2d33b33cb81804815176d064c898c1c060012f8c016ec1fbbf5742889',
};

export const INSTRUCTOR_CURRICULUM_IP_CURRENT_VERSION = '1.0';

/** Pseudonymous reference shown on instructor views (never a name or email). */
export function generateLicenseReference(): string {
  return `ELV-INST-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export type InstructorCurriculumLicenseReason =
  | 'ok'
  | 'unsigned'
  | 'stale_version'
  | 'hash_mismatch'
  | 'no_license'
  | 'revoked'
  | 'no_assignment'
  | 'not_instructor'
  | 'unavailable';

export interface InstructorCurriculumLicenseStatus {
  authorized: boolean;
  reason: InstructorCurriculumLicenseReason;
  agreementVersion: string;
  licenseReference: string | null;
  licenseId: string | null;
  assignedCourseIds: string[];
}

export interface CurrentInstructorCurriculumAgreement {
  version: string;
  hash: string | null;
}

export async function getCurrentInstructorCurriculumAgreement(
  db: any,
): Promise<CurrentInstructorCurriculumAgreement> {
  return getCurrentAgreement(db);
}

async function getCurrentAgreement(db: any): Promise<CurrentInstructorCurriculumAgreement> {
  const { data, error } = await db
    .from('agreement_versions')
    .select('version,current_version,document_hash')
    .eq('agreement_type', INSTRUCTOR_CURRICULUM_IP_AGREEMENT_TYPE)
    .eq('is_current', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    // No published row yet: the code-pinned v1.0 is the published version.
    return {
      version: INSTRUCTOR_CURRICULUM_IP_CURRENT_VERSION,
      hash: INSTRUCTOR_CURRICULUM_IP_VERSION_HASHES[INSTRUCTOR_CURRICULUM_IP_CURRENT_VERSION],
    };
  }
  return {
    version: String(data.current_version || data.version || INSTRUCTOR_CURRICULUM_IP_CURRENT_VERSION),
    hash: data.document_hash ? String(data.document_hash) : null,
  };
}

/**
 * Full authorization check for instructor-capacity access to proprietary
 * curriculum content. Fails closed on any database error.
 */
export async function getInstructorCurriculumLicenseStatus(
  db: any,
  userId: string,
  opts?: { courseId?: string },
): Promise<InstructorCurriculumLicenseStatus> {
  const denied = (
    reason: InstructorCurriculumLicenseReason,
    agreementVersion: string,
  ): InstructorCurriculumLicenseStatus => ({
    authorized: false,
    reason,
    agreementVersion,
    licenseReference: null,
    licenseId: null,
    assignedCourseIds: [],
  });

  try {
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    if (profileError || !profile || profile.role !== 'instructor') {
      return denied(
        profileError ? 'unavailable' : 'not_instructor',
        INSTRUCTOR_CURRICULUM_IP_CURRENT_VERSION,
      );
    }

    const current = await getCurrentAgreement(db);
    const expectedHash = INSTRUCTOR_CURRICULUM_IP_VERSION_HASHES[current.version];
    if (!expectedHash) {
      // The published version is newer than this code: do not authorize
      // until the new agreement text ships with the code.
      return denied('stale_version', current.version);
    }
    if (current.hash && current.hash !== expectedHash) {
      // The published text changed under the same version number.
      return denied('hash_mismatch', current.version);
    }

    const { data: acceptance, error: acceptanceError } = await db
      .from('license_agreement_acceptances')
      .select('id,document_version')
      .eq('user_id', userId)
      .eq('agreement_type', INSTRUCTOR_CURRICULUM_IP_AGREEMENT_TYPE)
      .eq('document_version', current.version)
      .maybeSingle();
    if (acceptanceError) return denied('unavailable', current.version);
    if (!acceptance) return denied('unsigned', current.version);

    const { data: license, error: licenseError } = await db
      .from('instructor_curriculum_licenses')
      .select('id,license_reference,status,agreement_version,scope')
      .eq('user_id', userId)
      .eq('agreement_type', INSTRUCTOR_CURRICULUM_IP_AGREEMENT_TYPE)
      .eq('agreement_version', current.version)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (licenseError) return denied('unavailable', current.version);
    if (!license) return denied('no_license', current.version);
    if (license.status === 'revoked') return denied('revoked', current.version);
    if (license.status !== 'active') return denied('no_license', current.version);

    const scopeCourseIds = Array.isArray((license.scope as any)?.course_ids)
      ? ((license.scope as any).course_ids as unknown[]).map(String)
      : [];
    if (opts?.courseId) {
      let assigned = false;
      try {
        assigned = await isAssignedCourseInstructor(db, userId, opts.courseId);
      } catch {
        return denied('unavailable', current.version);
      }
      if (!assigned) return denied('no_assignment', current.version);
    }

    return {
      authorized: true,
      reason: 'ok',
      agreementVersion: current.version,
      licenseReference: String(license.license_reference),
      licenseId: String(license.id),
      assignedCourseIds: scopeCourseIds,
    };
  } catch {
    return denied('unavailable', INSTRUCTOR_CURRICULUM_IP_CURRENT_VERSION);
  }
}

/**
 * Issue (or re-activate) the version-scoped license row after a verified
 * signature. Idempotent: an already-active license for the version is
 * returned unchanged. Call only from the server-side signing endpoint.
 */
export async function issueInstructorCurriculumLicense(
  db: any,
  input: {
    userId: string;
    agreementVersion: string;
    agreementHash: string;
    scopeCourseIds: string[];
    programIds: string[];
  },
): Promise<{ licenseReference: string; licenseId: string; alreadyActive: boolean }> {
  const existing = await db
    .from('instructor_curriculum_licenses')
    .select('id,license_reference,status')
    .eq('user_id', input.userId)
    .eq('agreement_type', INSTRUCTOR_CURRICULUM_IP_AGREEMENT_TYPE)
    .eq('agreement_version', input.agreementVersion)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing.error) throw new Error(`License lookup failed: ${existing.error.message}`);
  if (existing.data?.status === 'active') {
    return {
      licenseReference: String(existing.data.license_reference),
      licenseId: String(existing.data.id),
      alreadyActive: true,
    };
  }
  const licenseReference = generateLicenseReference();
  const { data, error } = await db
    .from('instructor_curriculum_licenses')
    .insert({
      user_id: input.userId,
      agreement_type: INSTRUCTOR_CURRICULUM_IP_AGREEMENT_TYPE,
      agreement_version: input.agreementVersion,
      agreement_hash: input.agreementHash,
      scope: { course_ids: input.scopeCourseIds, program_ids: input.programIds },
      license_reference: licenseReference,
      status: 'active',
      effective_at: new Date().toISOString(),
    })
    .select('id')
    .maybeSingle();
  if (error || !data) {
    throw new Error(`License issuance failed: ${error?.message || 'no license row returned'}`);
  }
  return { licenseReference, licenseId: String(data.id), alreadyActive: false };
}

/** Audit trail for signing, denial and revocation events. */
export async function logInstructorLicenseEvent(
  db: any,
  input: { userId: string; action: string; details?: Record<string, unknown>; ipAddress?: string | null },
): Promise<void> {
  const { error } = await db.from('license_audit_log').insert({
    user_id: input.userId,
    action: input.action,
    details: input.details ?? {},
    ip_address: input.ipAddress ?? null,
  });
  if (error) {
    // Audit failure must not break the enclosing request, but it must be visible.
    console.error('Instructor license audit log failed', error);
  }
}
