/**
 * Email barrel export.
 *
 * All email in the app goes through SendGrid. The wrapper provides one stable
 * result contract for older notification services and newer direct callers.
 */
import {
  sendEmail as sendGridEmail,
  trySendEmail,
  type EmailOptions,
} from './sendgrid';

export type EmailSendResult = {
  success: boolean;
  error?: string;
  from?: string;
  data?: { provider: string };
  messageId?: string;
};

export async function sendEmail(options: EmailOptions): Promise<EmailSendResult> {
  const result = await sendGridEmail(options);
  return {
    ...result,
    messageId: undefined,
  };
}

export { trySendEmail };
export type { EmailOptions };
export { emailTemplates, sendWelcomeEmail, sendEnrollmentEmail } from './legacy-templates';
