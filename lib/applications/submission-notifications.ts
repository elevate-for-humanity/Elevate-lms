import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export type ApplicationNotificationResult = {
  applicant: 'sent' | 'failed';
  staff: 'sent' | 'failed';
  applicantError?: string;
  staffError?: string;
};

type NotifyApplicationSubmissionInput = {
  db: SupabaseClient;
  applicationId: string;
  applicationType: string;
  applicantName: string;
  applicantEmail: string;
  applicantSubject: string;
  applicantHtml: string;
  staffSubject: string;
  staffHtml: string;
  staffEmail?: string;
  metadata?: Record<string, unknown>;
};

async function auditEmail(
  db: SupabaseClient,
  input: {
    applicationId: string;
    applicationType: string;
    audience: 'applicant' | 'staff';
    recipient: string;
    subject: string;
    success: boolean;
    error?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const now = new Date().toISOString();
  const { error } = await db.from('email_logs').insert({
    action: 'application_submission_notification',
    recipient_email: input.recipient,
    recipient: input.recipient,
    to: input.recipient,
    subject: input.subject,
    provider: 'sendgrid',
    status: input.success ? 'sent' : 'failed',
    error_message: input.error ?? null,
    error: input.error ?? null,
    sent_at: input.success ? now : null,
    details: {
      application_id: input.applicationId,
      application_type: input.applicationType,
      audience: input.audience,
      ...(input.metadata ?? {}),
    },
    metadata: {
      application_id: input.applicationId,
      application_type: input.applicationType,
      audience: input.audience,
      ...(input.metadata ?? {}),
    },
  });

  if (error) {
    logger.warn('[applications] email audit insert failed', {
      applicationId: input.applicationId,
      audience: input.audience,
      error: error.message,
    });
  }
}

async function sendAndAudit(
  db: SupabaseClient,
  message: EmailMessage,
  context: {
    applicationId: string;
    applicationType: string;
    audience: 'applicant' | 'staff';
    metadata?: Record<string, unknown>;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sendEmail(message);
    const success = result.success === true;
    const error = success ? undefined : result.error || 'Email provider returned an unsuccessful result.';

    await auditEmail(db, {
      ...context,
      recipient: message.to,
      subject: message.subject,
      success,
      error,
    });

    if (!success) {
      logger.error('[applications] submission email not sent', undefined, {
        applicationId: context.applicationId,
        applicationType: context.applicationType,
        audience: context.audience,
        recipient: message.to,
        error,
      });
    }

    return { success, error };
  } catch (caught) {
    const error = caught instanceof Error ? caught.message : String(caught);
    await auditEmail(db, {
      ...context,
      recipient: message.to,
      subject: message.subject,
      success: false,
      error,
    });
    logger.error('[applications] submission email threw', caught instanceof Error ? caught : undefined, {
      applicationId: context.applicationId,
      applicationType: context.applicationType,
      audience: context.audience,
      recipient: message.to,
    });
    return { success: false, error };
  }
}

/**
 * Canonical submission notification contract for public applications.
 *
 * A saved application must always leave an internal database notification, even
 * when the email provider is unavailable. Applicant/staff email attempts are
 * audited in email_logs so a successful HTTP submission can never silently hide
 * an email failure again.
 */
export async function notifyApplicationSubmission(
  input: NotifyApplicationSubmissionInput,
): Promise<ApplicationNotificationResult> {
  const staffEmail =
    input.staffEmail ||
    process.env.PARTNER_NOTIFICATION_EMAIL ||
    PLATFORM_DEFAULTS.supportEmail ||
    'elevate4humanityedu@gmail.com';

  await input.db.from('staff_notifications').insert({
    type: 'application_submitted',
    title: input.staffSubject,
    message: `${input.applicantName} (${input.applicantEmail}) submitted a ${input.applicationType} application. Reference: ${input.applicationId}`,
    severity: 'info',
    metadata: {
      application_id: input.applicationId,
      application_type: input.applicationType,
      applicant_name: input.applicantName,
      applicant_email: input.applicantEmail,
      ...(input.metadata ?? {}),
    },
  }).then(({ error }) => {
    if (error) {
      logger.warn('[applications] staff notification insert failed', {
        applicationId: input.applicationId,
        applicationType: input.applicationType,
        error: error.message,
      });
    }
  });

  const [applicant, staff] = await Promise.all([
    sendAndAudit(
      input.db,
      {
        to: input.applicantEmail,
        subject: input.applicantSubject,
        html: input.applicantHtml,
      },
      {
        applicationId: input.applicationId,
        applicationType: input.applicationType,
        audience: 'applicant',
        metadata: input.metadata,
      },
    ),
    sendAndAudit(
      input.db,
      {
        to: staffEmail,
        subject: input.staffSubject,
        html: input.staffHtml,
      },
      {
        applicationId: input.applicationId,
        applicationType: input.applicationType,
        audience: 'staff',
        metadata: input.metadata,
      },
    ),
  ]);

  return {
    applicant: applicant.success ? 'sent' : 'failed',
    staff: staff.success ? 'sent' : 'failed',
    ...(applicant.error ? { applicantError: applicant.error } : {}),
    ...(staff.error ? { staffError: staff.error } : {}),
  };
}
