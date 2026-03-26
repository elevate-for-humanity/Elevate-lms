/**
 * FERPA Audit Logging
 *
 * Logs access to student education records as required by the
 * Family Educational Rights and Privacy Act (20 U.S.C. § 1232g).
 *
 * Every access to PII (grades, SSN, financial aid, disciplinary records,
 * enrollment status) must be logged with who accessed it, when, and why.
 */

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

export type FerpaRecordType =
  | 'student_record'
  | 'grades'
  | 'transcript'
  | 'financial_aid'
  | 'enrollment'
  | 'disciplinary'
  | 'ssn'
  | 'attendance'
  | 'assessment'
  | 'directory_info'
  | 'accommodation';

export type FerpaAccessReason =
  | 'legitimate_educational_interest'
  | 'student_self_access'
  | 'parent_request'
  | 'directory_information'
  | 'health_safety_emergency'
  | 'judicial_order'
  | 'financial_aid_determination'
  | 'accreditation'
  | 'audit_or_evaluation'
  | 'transfer_request';

interface FerpaLogEntry {
  /** ID of the user accessing the record */
  accessorId: string;
  /** Role of the accessor (admin, instructor, staff, student) */
  accessorRole: string;
  /** ID of the student whose record is being accessed */
  studentId: string;
  /** Type of record accessed */
  recordType: FerpaRecordType;
  /** Specific record ID if applicable */
  recordId?: string;
  /** Why the access occurred */
  reason: FerpaAccessReason;
  /** What action was taken: view, update, export, delete */
  action: 'view' | 'update' | 'export' | 'delete' | 'print';
  /** Additional context (e.g., which fields were viewed) */
  details?: Record<string, unknown>;
}

/**
 * Log a FERPA-regulated access event.
 *
 * This function never throws — audit logging must not break the application.
 * Failures are logged to stderr for monitoring.
 */
export async function logFerpaAccess(entry: FerpaLogEntry): Promise<void> {
  try {
    const supabase = await createClient();
    const headerStore = await headers();
    const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = headerStore.get('user-agent') || 'unknown';

    const { error } = await supabase.from('audit_logs').insert({
      action: `ferpa.${entry.recordType}.${entry.action}`,
      user_id: entry.accessorId,
      resource_type: entry.recordType,
      resource_id: entry.recordId || entry.studentId,
      details: {
        ferpa: true,
        student_id: entry.studentId,
        accessor_role: entry.accessorRole,
        reason: entry.reason,
        ...entry.details,
      },
      ip_address: ip,
      user_agent: userAgent,
      success: true,
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('[FERPA Audit] Insert failed:', error.message);
    }
  } catch (err) {
    logger.error('[FERPA Audit] Exception:', err);
  }
}

/**
 * Log when a student views their own records (self-access).
 */
export async function logStudentSelfAccess(
  studentId: string,
  recordType: FerpaRecordType,
  recordId?: string
): Promise<void> {
  await logFerpaAccess({
    accessorId: studentId,
    accessorRole: 'student',
    studentId,
    recordType,
    reason: 'student_self_access',
    action: 'view',
    recordId,
  });
}

/**
 * Log when staff/admin views a student record.
 */
export async function logStaffRecordAccess(
  staffId: string,
  staffRole: string,
  studentId: string,
  recordType: FerpaRecordType,
  action: 'view' | 'update' | 'export' | 'delete' = 'view',
  recordId?: string
): Promise<void> {
  await logFerpaAccess({
    accessorId: staffId,
    accessorRole: staffRole,
    studentId,
    recordType,
    reason: 'legitimate_educational_interest',
    action,
    recordId,
  });
}

/**
 * Log SSN access — highest sensitivity, always logged.
 */
export async function logSsnAccess(
  accessorId: string,
  accessorRole: string,
  studentId: string,
  action: 'view' | 'update' = 'view'
): Promise<void> {
  await logFerpaAccess({
    accessorId,
    accessorRole,
    studentId,
    recordType: 'ssn',
    reason: 'legitimate_educational_interest',
    action,
    details: { sensitivity: 'high' },
  });
}

/**
 * Log data export containing student records.
 */
export async function logBulkExport(
  accessorId: string,
  accessorRole: string,
  recordType: FerpaRecordType,
  studentCount: number,
  reason: FerpaAccessReason = 'legitimate_educational_interest'
): Promise<void> {
  await logFerpaAccess({
    accessorId,
    accessorRole,
    studentId: 'bulk',
    recordType,
    reason,
    action: 'export',
    details: { student_count: studentCount },
  });
}
