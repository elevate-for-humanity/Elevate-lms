/**
 * Flag certificates when a payment refund/void occurs.
 * Credentials remain valid; only the funding status is flagged for audit traceability.
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
      let query = supabase.from(table.name).update({
        funding_status: reason,
        funding_status_changed_at: now,
        funding_status_reason: flagReason,
      });

      if (enrollmentId && table.enrollCol) query = query.eq(table.enrollCol, enrollmentId);
      else if (studentId && table.userCol) query = query.eq(table.userCol, studentId);
      else if (studentEmail && table.emailCol) query = query.eq(table.emailCol, studentEmail);
      else continue;

      const { data, error } = await query.eq('funding_status', 'funded').select('id');
      if (error) {
        if (error.code === '42P01' || error.code === '42703') continue;
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
    } catch (error) {
      logger.warn(`Certificate flagging error for ${table.name}`, { error: String(error) });
    }
  }

  if (totalFlagged > 0) {
    try {
      await logAuditEvent({
        action: 'CERTIFICATES_FUNDING_FLAGGED',
        actor_id: `system:${paymentProvider}_webhook`,
        resourceType: 'certificate',
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
    } catch {
      // Audit logging is best effort for webhook refund processing.
    }
  }

  return totalFlagged;
}
