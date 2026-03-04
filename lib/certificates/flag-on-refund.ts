/**
 * Flag certificates when a payment refund/void occurs.
 * 
 * Certificates are NOT revoked — training was delivered and the credential
 * remains valid. But the funding_status is flagged for audit traceability.
 * 
 * This is the correct behavior for workforce/ETPL programs:
 * - Instruction delivered = credential earned
 * - Refund = financial event, not academic event
 * - Auditors need to see the funding discrepancy, not a missing credential
 */

import { logger } from '@/lib/logger';
import { logAuditEvent } from '@/lib/audit';

type FundingStatus = 'refunded' | 'voided' | 'disputed';

interface FlagParams {
  supabase: any;
  studentEmail?: string;
  studentId?: string;
  enrollmentId?: string;
  reason: FundingStatus;
  paymentProvider: 'stripe' | 'sezzle' | 'affirm';
  paymentReference: string;
}

/**
 * Flag all certificates for a student/enrollment as having refunded funding.
 * Searches across all certificate tables.
 */
export async function flagCertificatesOnRefund(params: FlagParams): Promise<number> {
  const { supabase, studentEmail, studentId, enrollmentId, reason, paymentProvider, paymentReference } = params;
  const now = new Date().toISOString();
  const flagReason = `${paymentProvider}:${paymentReference}:${reason}`;
  let totalFlagged = 0;

  const tables = [
    { name: 'certificates', emailCol: 'student_email', userCol: 'student_id', enrollCol: 'enrollment_id' },
    { name: 'issued_certificates', emailCol: 'recipient_email', userCol: 'student_id', enrollCol: null },
    { name: 'program_completion_certificates', emailCol: null, userCol: 'user_id', enrollCol: null },
    { name: 'partner_certificates', emailCol: null, userCol: 'user_id', enrollCol: null },
    { name: 'module_certificates', emailCol: null, userCol: 'user_id', enrollCol: null },
  ];

  for (const table of tables) {
    try {
      // Build query — match by enrollment_id first (most specific), then student_id, then email
      let query = supabase
        .from(table.name)
        .update({
          funding_status: reason,
          funding_status_changed_at: now,
          funding_status_reason: flagReason,
        });

      if (enrollmentId && table.enrollCol) {
        query = query.eq(table.enrollCol, enrollmentId);
      } else if (studentId && table.userCol) {
        query = query.eq(table.userCol, studentId);
      } else if (studentEmail && table.emailCol) {
        query = query.eq(table.emailCol, studentEmail);
      } else {
        continue; // No matching column — skip this table
      }

      // Only flag certificates that are currently 'funded'
      query = query.eq('funding_status', 'funded');

      const { data, error } = await query.select('id');

      if (error) {
        // Table may not exist or column may not exist yet (migration not run)
        if (error.code === '42P01' || error.code === '42703') {
          continue; // Table/column doesn't exist — skip silently
        }
        logger.warn(`Failed to flag certificates in ${table.name}`, { error: error.message });
        continue;
      }

      const count = data?.length || 0;
      if (count > 0) {
        totalFlagged += count;
        logger.info(`Flagged ${count} certificates in ${table.name}`, {
          reason,
          paymentProvider,
          paymentReference,
          studentId: studentId || studentEmail,
        });
      }
    } catch (err) {
      // Best-effort — don't let certificate flagging break refund processing
      logger.warn(`Certificate flagging error for ${table.name}`, { error: String(err) });
    }
  }

  // Audit log
  if (totalFlagged > 0) {
    try {
      await logAuditEvent({
        action: 'CERTIFICATES_FUNDING_FLAGGED',
        actor_id: `system:${paymentProvider}_webhook`,
        target_type: 'certificate',
        metadata: {
          total_flagged: totalFlagged,
          funding_status: reason,
          payment_provider: paymentProvider,
          payment_reference: paymentReference,
          student_id: studentId,
          student_email: studentEmail,
          enrollment_id: enrollmentId,
        },
      });
    } catch { /* audit best-effort */ }
  }

  return totalFlagged;
}
