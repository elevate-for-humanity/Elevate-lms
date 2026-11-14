/**
 * Email barrel export.
 *
 * All email in the app goes through sendEmail in ./sendgrid (direct fetch, no SDK).
 */
export { sendEmail, trySendEmail } from './sendgrid';
export type { EmailOptions } from './sendgrid';
export { emailTemplates, sendWelcomeEmail, sendEnrollmentEmail } from './legacy-templates';
