/**
 * Email barrel export.
 *
 * All email in the app goes through sendEmail in ./resend (direct fetch, no SDK).
 * Templates are split across legacy-templates (full HTML) and email-service (simple).
 */
export { sendEmail, trySendEmail } from './resend';
export type { EmailOptions } from './resend';
export { emailTemplates, sendWelcomeEmail, sendEnrollmentEmail } from './legacy-templates';
