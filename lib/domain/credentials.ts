/**
 * Canonical credential types and mappers.
 *
 * All code consuming credential_registry or learner_credentials rows should
 * import from here rather than reading raw DB shapes directly. Null handling,
 * naming normalization, and status defaults live here once.
 */

// ── Raw DB shapes (only what we actually select) ──────────────────────────

export interface RawCredentialRow {
  id: string;
  name: string | null;
  abbreviation: string | null;
  issuer_type: string | null;
  issuing_authority: string | null;
  credential_stack: string | null;
  competency_area: string | null;
  stack_level: number | null;
  proctor_authority: string | null;
  description: string | null;
  is_active: boolean | null;
  is_published: boolean | null;
  wioa_eligible: boolean | null;
  requires_exam: boolean | null;
  exam_type: string | null;
  renewal_period_months: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface RawLearnerCredentialRow {
  id: string;
  learner_id: string | null;
  credential_id: string | null;
  credential_name: string | null;
  credential_type: string | null;
  status: string | null;
  issued_at: string | null;
  expires_at: string | null;
  certificate_id: string | null;
  verification_url: string | null;
  certifying_body: string | null;
  certificate_number: string | null;
  proctor_id: string | null;
  exam_date: string | null;
  exam_type: string | null;
  cohort_id: string | null;
  course_id: string | null;
  program_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
}

// ── Canonical app-facing types ────────────────────────────────────────────

export type IssuerType = 'elevate_issued' | 'elevate_proctored' | 'partner_delivered';

export interface CredentialRecord {
  id: string;
  name: string;
  abbreviation: string | null;
  issuerType: IssuerType;
  issuingAuthority: string;
  credentialStack: string | null;
  competencyArea: string | null;
  stackLevel: number | null;
  proctorAuthority: string | null;
  description: string;
  isActive: boolean;
  isPublished: boolean;
  wioaEligible: boolean;
  requiresExam: boolean;
  examType: string | null;
  renewalPeriodMonths: number | null;
  metadata: Record<string, unknown>;
}

export type LearnerCredentialStatus =
  | 'pending'
  | 'issued'
  | 'expired'
  | 'revoked'
  | 'failed';

export interface LearnerCredentialRecord {
  id: string;
  learnerId: string;
  credentialId: string | null;
  credentialName: string;
  credentialType: string;
  status: LearnerCredentialStatus;
  issuedAt: string | null;
  expiresAt: string | null;
  certificateId: string | null;
  verificationUrl: string | null;
  certifyingBody: string | null;
  certificateNumber: string | null;
  proctorId: string | null;
  examDate: string | null;
  examType: string | null;
  cohortId: string | null;
  courseId: string | null;
  programId: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
}

// ── Normalizers ───────────────────────────────────────────────────────────

const VALID_ISSUER_TYPES: IssuerType[] = [
  'elevate_issued',
  'elevate_proctored',
  'partner_delivered',
];

function normalizeIssuerType(raw: string | null): IssuerType {
  if (raw && (VALID_ISSUER_TYPES as string[]).includes(raw)) {
    return raw as IssuerType;
  }
  return 'partner_delivered';
}

const VALID_LEARNER_STATUSES: LearnerCredentialStatus[] = [
  'pending',
  'issued',
  'expired',
  'revoked',
  'failed',
];

function normalizeLearnerStatus(raw: string | null): LearnerCredentialStatus {
  if (raw && (VALID_LEARNER_STATUSES as string[]).includes(raw)) {
    return raw as LearnerCredentialStatus;
  }
  return 'pending';
}

// ── Mappers ───────────────────────────────────────────────────────────────

export function mapCredentialRow(row: RawCredentialRow): CredentialRecord {
  return {
    id: row.id,
    name: row.name ?? 'Unnamed Credential',
    abbreviation: row.abbreviation ?? null,
    issuerType: normalizeIssuerType(row.issuer_type),
    issuingAuthority: row.issuing_authority ?? 'Unknown',
    credentialStack: row.credential_stack ?? null,
    competencyArea: row.competency_area ?? null,
    stackLevel: row.stack_level ?? null,
    proctorAuthority: row.proctor_authority ?? null,
    description: row.description ?? '',
    isActive: row.is_active ?? true,
    isPublished: row.is_published ?? false,
    wioaEligible: row.wioa_eligible ?? false,
    requiresExam: row.requires_exam ?? false,
    examType: row.exam_type ?? null,
    renewalPeriodMonths: row.renewal_period_months ?? null,
    metadata: row.metadata ?? {},
  };
}

export function mapLearnerCredentialRow(
  row: RawLearnerCredentialRow
): LearnerCredentialRecord {
  return {
    id: row.id,
    learnerId: row.learner_id ?? '',
    credentialId: row.credential_id ?? null,
    credentialName: row.credential_name ?? 'Unnamed Credential',
    credentialType: row.credential_type ?? 'Certificate',
    status: normalizeLearnerStatus(row.status),
    issuedAt: row.issued_at ?? null,
    expiresAt: row.expires_at ?? null,
    certificateId: row.certificate_id ?? null,
    verificationUrl: row.verification_url ?? null,
    certifyingBody: row.certifying_body ?? null,
    certificateNumber: row.certificate_number ?? null,
    proctorId: row.proctor_id ?? null,
    examDate: row.exam_date ?? null,
    examType: row.exam_type ?? null,
    cohortId: row.cohort_id ?? null,
    courseId: row.course_id ?? null,
    programId: row.program_id ?? null,
    notes: row.notes ?? null,
    metadata: row.metadata ?? {},
  };
}

// ── Guards ────────────────────────────────────────────────────────────────

/** Throws if a credential record is missing fields required for issuance. */
export function assertIssuable(c: LearnerCredentialRecord): void {
  const missing: string[] = [];
  if (!c.learnerId) missing.push('learner_id');
  if (!c.credentialName) missing.push('credential_name');
  if (!c.credentialType) missing.push('credential_type');
  if (!c.certificateId) missing.push('certificate_id');
  if (missing.length > 0) {
    throw new Error(
      `Cannot issue credential: missing required fields: ${missing.join(', ')}`
    );
  }
}

/** Returns true if the credential has a valid, non-expired certificate ID. */
export function isVerifiable(c: LearnerCredentialRecord): boolean {
  if (!c.certificateId || c.status !== 'issued') return false;
  if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
  return true;
}
