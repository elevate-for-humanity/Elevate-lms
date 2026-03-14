/**
 * Canonical certificate / verification types and mappers.
 *
 * Covers the public-facing certificate shape returned by /api/verify and
 * the admin certificate generation pipeline. Keeps null handling and
 * verification URL construction in one place.
 */

// ── Raw DB shape ──────────────────────────────────────────────────────────

export interface RawCertificateRow {
  id: string;
  certificate_id: string | null;
  learner_id: string | null;
  learner_name: string | null;
  credential_name: string | null;
  credential_type: string | null;
  issuing_authority: string | null;
  issued_at: string | null;
  expires_at: string | null;
  status: string | null;
  verification_url: string | null;
  course_id: string | null;
  program_id: string | null;
  certifying_body: string | null;
  certificate_number: string | null;
  exam_date: string | null;
  exam_type: string | null;
  metadata: Record<string, unknown> | null;
}

// ── Canonical type ────────────────────────────────────────────────────────

export type CertificateStatus = 'active' | 'expired' | 'revoked' | 'pending';

export interface CertificateRecord {
  id: string;
  certificateId: string;
  learnerId: string;
  learnerName: string;
  credentialName: string;
  credentialType: string;
  issuingAuthority: string;
  issuedAt: string;
  expiresAt: string | null;
  status: CertificateStatus;
  verificationUrl: string;
  courseId: string | null;
  programId: string | null;
  certifyingBody: string | null;
  certificateNumber: string | null;
  examDate: string | null;
  examType: string | null;
  metadata: Record<string, unknown>;
}

// ── Normalizers ───────────────────────────────────────────────────────────

const VALID_STATUSES: CertificateStatus[] = ['active', 'expired', 'revoked', 'pending'];

function normalizeCertStatus(raw: string | null): CertificateStatus {
  if (raw && (VALID_STATUSES as string[]).includes(raw)) {
    return raw as CertificateStatus;
  }
  return 'pending';
}

function buildVerificationUrl(certId: string, existing: string | null): string {
  if (existing?.startsWith('http')) return existing;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://elevateforhumanity.org';
  return `${base}/verify/${certId}`;
}

// ── Mapper ────────────────────────────────────────────────────────────────

export function mapCertificateRow(row: RawCertificateRow): CertificateRecord {
  const certId = row.certificate_id ?? row.id;
  return {
    id: row.id,
    certificateId: certId,
    learnerId: row.learner_id ?? '',
    learnerName: row.learner_name ?? 'Unknown Learner',
    credentialName: row.credential_name ?? 'Unnamed Credential',
    credentialType: row.credential_type ?? 'Certificate',
    issuingAuthority: row.issuing_authority ?? 'Elevate for Humanity',
    issuedAt: row.issued_at ?? new Date().toISOString(),
    expiresAt: row.expires_at ?? null,
    status: normalizeCertStatus(row.status),
    verificationUrl: buildVerificationUrl(certId, row.verification_url),
    courseId: row.course_id ?? null,
    programId: row.program_id ?? null,
    certifyingBody: row.certifying_body ?? null,
    certificateNumber: row.certificate_number ?? null,
    examDate: row.exam_date ?? null,
    examType: row.exam_type ?? null,
    metadata: row.metadata ?? {},
  };
}

// ── Guards ────────────────────────────────────────────────────────────────

/** Throws if a certificate row is missing fields required before generation. */
export function assertGeneratable(row: RawCertificateRow): void {
  const missing: string[] = [];
  if (!row.certificate_id) missing.push('certificate_id');
  if (!row.learner_id) missing.push('learner_id');
  if (!row.learner_name) missing.push('learner_name');
  if (!row.credential_name) missing.push('credential_name');
  if (!row.credential_type) missing.push('credential_type');
  if (!row.issued_at) missing.push('issued_at');
  if (missing.length > 0) {
    throw new Error(
      `Certificate generation blocked: missing required fields: ${missing.join(', ')}`
    );
  }
}

/** Returns true if the certificate is currently valid (issued + not expired). */
export function isCertificateValid(cert: CertificateRecord): boolean {
  if (cert.status !== 'active') return false;
  if (cert.expiresAt && new Date(cert.expiresAt) < new Date()) return false;
  return true;
}
