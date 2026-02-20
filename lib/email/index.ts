/**
 * Email barrel export.
 *
 * sendEmail uses direct fetch to Resend API (no SDK init at import time).
 * emailTemplates provides pre-built HTML templates.
 */
export { sendEmail, trySendEmail } from './resend';
export type { EmailOptions } from './resend';
export { emailTemplates } from './email-service';
