/**
 * Workflow Notification Adapter
 *
 * Connects to existing Elevate notification services:
 * - Email: lib/notifications/email.ts -> emailService (Resend via lib/email.ts)
 * - SMS:   lib/notifications/sms.ts  -> smsService (Twilio)
 * - Queue: lib/notifications/index.ts -> enqueueNotification (Supabase RPC)
 *
 * All channels are live -- no stubs, no mocks.
 */

import { emailService } from '@/lib/notifications/email';
import { smsService } from '@/lib/notifications/sms';
import { enqueueNotification } from '@/lib/notifications/index';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export type NotificationTemplate =
  | 'APPLICATION_RECEIVED'
  | 'DOCUMENTS_REQUIRED'
  | 'DOCUMENT_REJECTED'
  | 'DOCUMENT_APPROVED'
  | 'FUNDING_UPDATE'
  | 'FUNDING_APPROVED'
  | 'FUNDING_DENIED'
  | 'CONDITIONAL_ACCEPTANCE'
  | 'ACCEPTANCE'
  | 'REJECTION'
  | 'WAITLIST'
  | 'PAYMENT_REQUIRED'
  | 'ENROLLMENT_COMPLETE'
  | 'TASK_OVERDUE'
  | 'REMINDER';

export interface NotificationInput {
  template: NotificationTemplate;
  applicationId: string;
  recipient: string;
  variables?: Record<string, string>;
  channels?: ('email' | 'sms')[];
}

const TEMPLATE_CONFIG: Record<
  NotificationTemplate,
  {
    subject: string;
    body: (vars: Record<string, string>) => string;
  }
> = {
  APPLICATION_RECEIVED: {
    subject: 'Your application has been received -- Next Steps',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `We received your application! We'll review it and contact you within 1-2 business days.\n\n` +
      `Application ID: ${v.applicationId ?? ''}\n\n` +
      `Questions? Contact us at ${PLATFORM_DEFAULTS.supportPhone} or reply to this email.\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  DOCUMENTS_REQUIRED: {
    subject: 'Action Required: Upload Required Documents',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `Please upload the required documents to continue your application.\n\n` +
      `Log in to your dashboard to see which documents are needed.\n\n` +
      `Questions? Contact us at ${PLATFORM_DEFAULTS.supportPhone}.\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  DOCUMENT_REJECTED: {
    subject: 'Document Update Required',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `One of your documents needs to be re-uploaded.\n\n` +
      `Reason: ${v.rejectionReason ?? 'Please review and re-upload a clearer copy.'}\n\n` +
      `Log in to your dashboard for details.\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  DOCUMENT_APPROVED: {
    subject: 'Document Approved',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `Your ${v.documentType ?? 'document'} has been approved.\n\n` +
      `${v.nextStep ?? 'Continue completing your application.'}\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  FUNDING_UPDATE: {
    subject: 'Funding Application Update',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `There's an update on your funding application.\n\n` +
      `Check your email for details or log in to your dashboard.\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  FUNDING_APPROVED: {
    subject: 'Great News: Your Funding Has Been Approved!',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `Your funding application has been approved!\n\n` +
      `Approved amount: ${v.approvedAmount ?? 'See your dashboard'}\n\n` +
      `Log in to your dashboard for next steps.\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  FUNDING_DENIED: {
    subject: 'Funding Application Update',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `We've updated your funding application.\n\n` +
      `Log in to your dashboard to review the details and explore other options.\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  CONDITIONAL_ACCEPTANCE: {
    subject: 'Conditional Acceptance -- Action Required',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `You've been conditionally accepted! Please complete the required conditions listed in your dashboard.\n\n` +
      `Contact your admissions representative with any questions.\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  ACCEPTANCE: {
    subject: 'Congratulations! You\'ve Been Accepted!',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `Congratulations! You've been accepted into the ${v.programName ?? 'program'}.\n\n` +
      `Log in to your dashboard for enrollment instructions and next steps.\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  REJECTION: {
    subject: 'Application Update',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `We've reviewed your application. Unfortunately, we are unable to offer admission at this time.\n\n` +
      `Please reach out if you have questions or would like to discuss other opportunities.\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  WAITLIST: {
    subject: 'Application Status Update',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `You've been placed on our waitlist. We'll contact you when a spot opens.\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  PAYMENT_REQUIRED: {
    subject: 'Payment Required to Complete Enrollment',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `Please complete your payment to finalize enrollment.\n\n` +
      `Amount due: ${v.amountDue ?? 'See your dashboard'}\n\n` +
      `Log in to pay at ${PLATFORM_DEFAULTS.canonicalDomain}/dashboard.\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  ENROLLMENT_COMPLETE: {
    subject: 'You\'re Enrolled! Welcome to Elevate!',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `You're enrolled in ${v.programName ?? 'your program'}! Check your email for login details and orientation information.\n\n` +
      `Log in to your student dashboard: ${PLATFORM_DEFAULTS.siteUrl}/learner/dashboard\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  TASK_OVERDUE: {
    subject: 'Reminder: Action Required on Your Application',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `Please complete the required action on your application: ${v.taskDescription ?? 'See your dashboard'}.\n\n` +
      `Log in to your dashboard to continue.\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
  REMINDER: {
    subject: 'Reminder: Complete Your Application',
    body: (v) =>
      `Hello ${v.firstName ?? ''},\n\n` +
      `Don't forget to complete your application! Your next step: ${v.nextStep ?? 'Log in to continue'}.\n\n` +
      `${PLATFORM_DEFAULTS.siteUrl}/dashboard\n\n` +
      `-- ${PLATFORM_DEFAULTS.orgName}`,
  },
};

/**
 * Send a workflow notification via configured channels.
 * Routes email through enqueueNotification (async queue -> Resend) and
 * SMS through smsService (Twilio).
 */
export async function sendWorkflowNotification(
  input: NotificationInput,
): Promise<{ success: boolean; error?: string }> {
  const config = TEMPLATE_CONFIG[input.template];

  if (!config) {
    logger.error('[notifications-adapter] Unknown template', { template: input.template });
    return { success: false, error: 'Unknown template' };
  }

  const channels = input.channels ?? ['email'];
  const variables: Record<string, string> = {
    applicationId: input.applicationId,
    recipient: input.recipient,
    ...input.variables,
  };

  const subject = config.subject;
  const body = config.body(variables);
  const isEmail = input.recipient.includes('@');

  try {
    // Email via enqueueNotification -> Resend
    if (channels.includes('email') && isEmail) {
      await enqueueNotification({
        toEmail: input.recipient,
        templateKey: 'inquiry_received',
        templateData: { ...variables, body, subject },
        entityType: 'application',
        entityId: input.applicationId,
      });
    }

    // SMS via Twilio
    if (channels.includes('sms') && !isEmail && input.recipient.length >= 10) {
      const smsResult = await smsService.send({
        to: input.recipient,
        message: body.substring(0, 160),
      });

      if (!smsResult.success) {
        logger.warn('[notifications-adapter] SMS failed', {
          to: input.recipient,
          error: smsResult.error,
        });
      }
    }

    logger.info('[notifications-adapter] Notification sent', {
      template: input.template,
      recipient: input.recipient,
      channels,
      applicationId: input.applicationId,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[notifications-adapter] Notification failed', {
      template: input.template,
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Send batch notifications.
 */
export async function sendBatchNotifications(
  notifications: NotificationInput[],
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const notification of notifications) {
    const result = await sendWorkflowNotification(notification);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Get notification history for an application from the database.
 */
export async function getNotificationHistory(
  applicationId: string,
): Promise<
  Array<{
    template: NotificationTemplate;
    channel: 'email' | 'sms';
    sentAt: string;
    status: 'sent' | 'failed';
  }>
> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const results: Array<{
    template: NotificationTemplate;
    channel: 'email' | 'sms';
    sentAt: string;
    status: 'sent' | 'failed';
  }> = [];

  const { data: emailLogs } = await supabase
    .from('email_notification_log')
    .select('template_key, created_at, status')
    .eq('entity_id', applicationId)
    .order('created_at', { ascending: false });

  if (emailLogs) {
    for (const log of emailLogs) {
      results.push({
        template: (log.template_key as NotificationTemplate) ?? 'APPLICATION_RECEIVED',
        channel: 'email',
        sentAt: log.created_at,
        status: log.status === 'sent' ? 'sent' : 'failed',
      });
    }
  }

  const { data: smsLogs } = await supabase
    .from('sms_logs')
    .select('message, created_at, status')
    .eq('entity_id', applicationId)
    .order('created_at', { ascending: false });

  if (smsLogs) {
    for (const log of smsLogs) {
      results.push({
        template: 'REMINDER',
        channel: 'sms',
        sentAt: log.created_at,
        status: log.status === 'sent' ? 'sent' : 'failed',
      });
    }
  }

  return results;
}
