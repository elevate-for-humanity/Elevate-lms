/**
 * Workflow Notification Adapter
 * 
 * Handles email and SMS notifications for the application workflow.
 * Connect this to your existing email/SMS services.
 */

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

/**
 * Template configurations
 */
const TEMPLATE_CONFIG: Record<
  NotificationTemplate,
  {
    emailSubject: string;
    emailTemplate: string;
    smsTemplate: string;
  }
> = {
  APPLICATION_RECEIVED: {
    emailSubject: 'Your application has been received - Next Steps',
    emailTemplate: 'application-received',
    smsTemplate: 'Hi {{firstName}}, we received your application! We'll review it and contact you within 1-2 business days.',
  },
  
  DOCUMENTS_REQUIRED: {
    emailSubject: 'Action Required: Upload Required Documents',
    emailTemplate: 'documents-required',
    smsTemplate: 'Hi {{firstName}}, please upload the required documents to continue your application.',
  },
  
  DOCUMENT_REJECTED: {
    emailSubject: 'Document Update Required',
    emailTemplate: 'document-rejected',
    smsTemplate: 'Hi {{firstName}}, one of your documents needs to be re-uploaded. Please check your email for details.',
  },
  
  DOCUMENT_APPROVED: {
    emailSubject: 'Document Approved',
    emailTemplate: 'document-approved',
    smsTemplate: 'Hi {{firstName}}, your document has been approved.',
  },
  
  FUNDING_UPDATE: {
    emailSubject: 'Funding Application Update',
    emailTemplate: 'funding-update',
    smsTemplate: 'Hi {{firstName}}, there\'s an update on your funding application. Check your email for details.',
  },
  
  FUNDING_APPROVED: {
    emailSubject: 'Great News: Your Funding Has Been Approved!',
    emailTemplate: 'funding-approved',
    smsTemplate: 'Hi {{firstName}}, your funding has been approved! Check your email for details.',
  },
  
  FUNDING_DENIED: {
    emailSubject: 'Funding Application Update',
    emailTemplate: 'funding-denied',
    smsTemplate: 'Hi {{firstName}}, there\'s an update on your funding application. Check your email for details.',
  },
  
  CONDITIONAL_ACCEPTANCE: {
    emailSubject: 'Conditional Acceptance - Action Required',
    emailTemplate: 'conditional-acceptance',
    smsTemplate: 'Hi {{firstName}}, you\'ve been conditionally accepted! Please complete the required conditions.',
  },
  
  ACCEPTANCE: {
    emailSubject: 'Congratulations! You\'ve Been Accepted!',
    emailTemplate: 'acceptance',
    smsTemplate: 'Hi {{firstName}}, congratulations! You\'ve been accepted. Check your email for next steps.',
  },
  
  REJECTION: {
    emailSubject: 'Application Update',
    emailTemplate: 'rejection',
    smsTemplate: 'Hi {{firstName}}, we\'ve reviewed your application. Check your email for an update.',
  },
  
  WAITLIST: {
    emailSubject: 'Application Status Update',
    emailTemplate: 'waitlist',
    smsTemplate: 'Hi {{firstName}}, you\'ve been placed on our waitlist. We\'ll contact you when a spot opens.',
  },
  
  PAYMENT_REQUIRED: {
    emailSubject: 'Payment Required to Complete Enrollment',
    emailTemplate: 'payment-required',
    smsTemplate: 'Hi {{firstName}}, please complete your payment to finalize enrollment. Check your email for details.',
  },
  
  ENROLLMENT_COMPLETE: {
    emailSubject: 'You\'re Enrolled! Welcome to Elevate!',
    emailTemplate: 'enrollment-complete',
    smsTemplate: 'Hi {{firstName}}, you\'re enrolled! Check your email for login details and orientation info.',
  },
  
  TASK_OVERDUE: {
    emailSubject: 'Reminder: Action Required on Your Application',
    emailTemplate: 'task-overdue',
    smsTemplate: 'Hi {{firstName}}, please complete the required action on your application.',
  },
  
  REMINDER: {
    emailSubject: 'Reminder: Complete Your Application',
    emailTemplate: 'reminder',
    smsTemplate: 'Hi {{firstName}}, don\'t forget to complete your application!',
  },
};

/**
 * Replace template variables
 */
function interpolateTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  return result;
}

/**
 * Send a workflow notification
 * 
 * This is a stub implementation - connect to your actual
 * email/SMS services (SendGrid, Twilio, etc.)
 */
export async function sendWorkflowNotification(
  input: NotificationInput,
): Promise<{ success: boolean; error?: string }> {
  const config = TEMPLATE_CONFIG[input.template];
  
  if (!config) {
    console.error('Unknown notification template:', input.template);
    return { success: false, error: 'Unknown template' };
  }
  
  // Default to email only
  const channels = input.channels ?? ['email'];
  
  // Build variables with defaults
  const variables: Record<string, string> = {
    applicationId: input.applicationId,
    recipient: input.recipient,
    ...input.variables,
  };
  
  // Log notification request (replace with actual service calls)
  console.info('workflow.notification.requested', {
    template: input.template,
    emailSubject: interpolateTemplate(config.emailSubject, variables),
    smsTemplate: interpolateTemplate(config.smsTemplate, variables),
    applicationId: input.applicationId,
    recipient: input.recipient,
    channels,
  });
  
  try {
    // TODO: Implement actual email sending
    if (channels.includes('email')) {
      await sendEmail({
        to: input.recipient,
        subject: interpolateTemplate(config.emailSubject, variables),
        template: config.emailTemplate,
        variables,
      });
    }
    
    // TODO: Implement actual SMS sending
    if (channels.includes('sms') && input.recipient) {
      // Only send SMS if phone number (basic validation)
      if (input.recipient.includes('@') === false && input.recipient.length >= 10) {
        await sendSMS({
          to: input.recipient,
          message: interpolateTemplate(config.smsTemplate, variables),
        });
      }
    }
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to send notification:', {
      template: input.template,
      error: errorMessage,
    });
    
    // Log failure but don't throw - notifications shouldn't break the flow
    return { success: false, error: errorMessage };
  }
}

/**
 * Send email (stub)
 */
async function sendEmail(input: {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, string>;
}): Promise<void> {
  // TODO: Integrate with email service (Resend, SendGrid, etc.)
  console.log('EMAIL:', {
    to: input.to,
    subject: input.subject,
    template: input.template,
    variables,
  });
  
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'Elevate <noreply@elevateforhumanity.org>',
  //   to: input.to,
  //   subject: input.subject,
  //   react: EmailTemplate({ ... }),
  // });
}

/**
 * Send SMS (stub)
 */
async function sendSMS(input: {
  to: string;
  message: string;
}): Promise<void> {
  // TODO: Integrate with SMS service (Twilio, etc.)
  console.log('SMS:', {
    to: input.to,
    message: input.message,
  });
  
  // Example with Twilio:
  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  // await client.messages.create({
  //   body: input.message,
  //   from: process.env.TWILIO_PHONE,
  //   to: input.to,
  // });
}

/**
 * Send batch notifications (for cron jobs)
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
 * Get notification history for an application
 * (For admin dashboard display)
 */
export async function getNotificationHistory(
  applicationId: string,
): Promise<Array<{
  template: NotificationTemplate;
  channel: 'email' | 'sms';
  sentAt: string;
  status: 'sent' | 'failed';
}>> {
  // TODO: Query notification log table
  return [];
}
