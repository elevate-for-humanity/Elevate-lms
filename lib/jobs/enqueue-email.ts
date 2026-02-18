import { enqueueJob } from './queue';
import { EmailType } from './handlers/email-send';

/**
 * STEP 6B: Helper to enqueue emails asynchronously
 * 
 * Usage:
 * ```
 * await enqueueEmail({
 *   emailType: 'license_activated',
 *   to: 'user@elevateforhumanity.org',
 *   correlationId: paymentIntentId,
 *   tenantId: tenant.id,
 *   templateData: { plan: 'professional', tenantName: 'Acme Corp' }
 * });
 * ```
 */

interface EnqueueEmailParams {
  emailType: EmailType;
  to: string;
  correlationId: string;
  tenantId?: string;
  templateData?: Record<string, unknown>;
}

export async function enqueueEmail(params: EnqueueEmailParams): Promise<string> {
  return enqueueJob({
    jobType: 'email_send',
    correlationId: params.correlationId,
    tenantId: params.tenantId,
    payload: {
      emailType: params.emailType,
      to: params.to,
      templateData: params.templateData || {},
    },
  });
}

/**
 * Convenience methods for common emails
 */
export const emails = {
  async licenseActivated(
    to: string,
    correlationId: string,
    tenantId: string,
    data: { plan: string; tenantName: string; loginUrl?: string }
  ) {
    return enqueueEmail({
      emailType: 'license_activated',
      to,
      correlationId,
      tenantId,
      templateData: data,
    });
  },
  
  async licenseSuspended(
    to: string,
    correlationId: string,
    tenantId: string,
    data: { reason: string; billingUrl?: string }
  ) {
    return enqueueEmail({
      emailType: 'license_suspended',
      to,
      correlationId,
      tenantId,
      templateData: data,
    });
  },
  
  async paymentFailed(
    to: string,
    correlationId: string,
    tenantId: string,
    data: { billingUrl?: string }
  ) {
    return enqueueEmail({
      emailType: 'payment_failed',
      to,
      correlationId,
      tenantId,
      templateData: data,
    });
  },
};
