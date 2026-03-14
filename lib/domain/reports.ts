/**
 * Canonical admin reporting row types and mappers.
 *
 * Admin report pages join across multiple tables and historically each page
 * has its own inline normalization. These mappers centralize that logic.
 */

// ── Raw DB shapes ─────────────────────────────────────────────────────────

export interface RawStudentRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  enrollment_status: string | null;
  created_at: string | null;
}

export interface RawEnrollmentRow {
  id: string;
  status: string | null;
  program_id: string | null;
  course_id: string | null;
  user_id: string | null;
  created_at: string | null;
}

export interface RawCertificateReportRow {
  id: string;
  certificate_number: string | null;
  status: string | null;
  credential_name: string | null;
  issued_at: string | null;
  created_at: string | null;
}

export interface RawProgramSummaryRow {
  id: string;
  name: string | null;
  title: string | null;
  status: string | null;
}

export interface RawCourseSummaryRow {
  id: string;
  course_name: string | null;
  title: string | null;
  is_active: boolean | null;
  status: string | null;
}

// ── Canonical report row types ────────────────────────────────────────────

export interface StudentReportRow {
  id: string;
  displayName: string;
  email: string;
  role: string;
  enrollmentStatus: string;
  registeredAt: string;
}

export interface EnrollmentReportRow {
  id: string;
  shortId: string;
  status: string;
  programId: string | null;
  shortProgramId: string;
  enrolledAt: string;
}

export interface CertificateReportRow {
  id: string;
  shortId: string;
  certificateNumber: string | null;
  status: string;
  credentialName: string;
  issuedAt: string;
}

export interface ProgramSummaryRow {
  id: string;
  title: string;
  status: string;
}

export interface CourseSummaryRow {
  id: string;
  title: string;
  isActive: boolean;
}

// ── Mappers ───────────────────────────────────────────────────────────────

function formatDate(raw: string | null): string {
  if (!raw) return '—';
  return new Date(raw).toLocaleDateString();
}

export function mapStudentRow(row: RawStudentRow): StudentReportRow {
  return {
    id: row.id,
    displayName: row.full_name?.trim() || row.email || 'Unknown',
    email: row.email ?? '',
    role: row.role ?? 'student',
    enrollmentStatus: row.enrollment_status ?? 'pending',
    registeredAt: formatDate(row.created_at),
  };
}

export function mapEnrollmentRow(row: RawEnrollmentRow): EnrollmentReportRow {
  return {
    id: row.id,
    shortId: row.id.slice(0, 8),
    status: row.status ?? 'active',
    programId: row.program_id ?? null,
    shortProgramId: row.program_id?.slice(0, 8) ?? '—',
    enrolledAt: formatDate(row.created_at),
  };
}

export function mapCertificateReportRow(row: RawCertificateReportRow): CertificateReportRow {
  return {
    id: row.id,
    shortId: row.id.slice(0, 8),
    certificateNumber: row.certificate_number ?? null,
    status: row.status ?? 'issued',
    credentialName: row.credential_name ?? 'Certificate of Completion',
    issuedAt: formatDate(row.issued_at ?? row.created_at),
  };
}

export function mapProgramSummaryRow(row: RawProgramSummaryRow): ProgramSummaryRow {
  return {
    id: row.id,
    // Resolve title/name drift once here
    title: row.title?.trim() || row.name?.trim() || 'Unnamed Program',
    status: row.status ?? 'draft',
  };
}

export function mapCourseSummaryRow(row: RawCourseSummaryRow): CourseSummaryRow {
  return {
    id: row.id,
    // Resolve course_name/title drift once here
    title: row.title?.trim() || row.course_name?.trim() || 'Untitled Course',
    isActive: row.is_active ?? (row.status === 'published'),
  };
}
