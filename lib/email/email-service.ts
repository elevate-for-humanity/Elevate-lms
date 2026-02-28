/**
 * Email Service — delegates to the canonical sendEmail in ./sendgrid.
 * Kept for its emailTemplates export.
 */
export { sendEmail } from './sendgrid';
export type { EmailOptions } from './sendgrid';
// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to Elevate For Humanity',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">Welcome, ${name}!</h1>
        <p>Thank you for joining Elevate For Humanity. We're excited to help you on your educational journey.</p>
        <p>Get started by exploring our programs and courses.</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/programs" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Browse Programs
        </a>
      </div>
    `,
  }),
  enrollmentConfirmation: (name: string, programName: string) => ({
    subject: `Enrollment Confirmed: ${programName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">Enrollment Confirmed!</h1>
        <p>Hi ${name},</p>
        <p>You've been successfully enrolled in <strong>${programName}</strong>.</p>
        <p>You can now access your course materials and start learning.</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Go to Dashboard
        </a>
      </div>
    `,
  }),
  certificateReady: (
    name: string,
    courseName: string,
    certificateUrl: string
  ) => ({
    subject: `Your Certificate is Ready: ${courseName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Congratulations, ${name}!</h1>
        <p>You've completed <strong>${courseName}</strong>.</p>
        <p>Your certificate is now available for download.</p>
        <a href="${certificateUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Download Certificate
        </a>
      </div>
    `,
  }),
  passwordReset: (name: string, resetUrl: string) => ({
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Reset Password
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  }),
  assignmentReminder: (
    name: string,
    assignmentName: string,
    dueDate: string
  ) => ({
    subject: `Reminder: ${assignmentName} Due Soon`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Assignment Reminder</h1>
        <p>Hi ${name},</p>
        <p>This is a reminder that <strong>${assignmentName}</strong> is due on ${dueDate}.</p>
        <p>Make sure to submit your work on time.</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          View Assignment
        </a>
      </div>
    `,
  }),
};
