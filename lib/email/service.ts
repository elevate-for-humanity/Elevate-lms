/**
 * EMAIL SERVICE
 *
 * Delegates to the canonical sendEmail in ./resend.
 * Keeps helper functions for specific email scenarios.
 */

import { sendEmail as coreSendEmail } from './sendgrid';
import type { EmailOptions as CoreEmailOptions } from './sendgrid';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export type EmailOptions = CoreEmailOptions;

/**
 * Send email (non-blocking, logs errors). Returns boolean for backward compat.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const result = await coreSendEmail(options);
  return result.success;
}

/**
 * Send application confirmation to applicant
 */
export async function sendApplicationConfirmation(
  email: string,
  name: string,
  programName: string
) {
  return sendEmail({
    to: email,
    subject: 'Application Received - Elevate for Humanity',
    html: `
      <h1>Application Received</h1>
      <p>Hi ${name},</p>
      <p>Thank you for applying to <strong>${programName}</strong>.</p>
      <p>We've received your application and will review it shortly. You'll hear from us within 2-3 business days.</p>
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Our admissions team will review your application</li>
        <li>We may contact you for additional information</li>
        <li>You'll receive an email when a decision is made</li>
      </ul>
      <p>Questions? Reply to this email or call us at 317-314-3757.</p>
      <p>Best regards,<br>Elevate for Humanity Team</p>
    `,
    text: `Hi ${name}, Thank you for applying to ${programName}. We've received your application and will review it shortly.`,
  });
}

/**
 * Send admin notification for new application
 */
export async function sendAdminApplicationNotification(
  applicantName: string,
  applicantEmail: string,
  programName: string,
  applicationId: string
) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Application: ${applicantName} - ${programName}`,
    html: `
      <h1>New Application Received</h1>
      <p><strong>Applicant:</strong> ${applicantName}</p>
      <p><strong>Email:</strong> ${applicantEmail}</p>
      <p><strong>Program:</strong> ${programName}</p>
      <p><strong>Application ID:</strong> ${applicationId}</p>
      <p><a href="https://www.elevateforhumanity.org/admin/applications/${applicationId}">View Application</a></p>
    `,
    text: `New application from ${applicantName} (${applicantEmail}) for ${programName}`,
  });
}

/**
 * Send enrollment approval notification to student
 */
export async function sendEnrollmentApprovalNotification(
  email: string,
  name: string,
  programName: string
) {
  return sendEmail({
    to: email,
    subject: 'Enrollment Approved - Elevate for Humanity',
    html: `
      <h1>Enrollment Approved!</h1>
      <p>Hi ${name},</p>
      <p>Great news! Your enrollment in <strong>${programName}</strong> has been approved.</p>
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Log in to your student dashboard</li>
        <li>Complete your profile</li>
        <li>Start your first lesson</li>
      </ol>
      <p><a href="https://www.elevateforhumanity.org/lms/dashboard">Go to Dashboard</a></p>
      <p>Welcome to Elevate for Humanity!</p>
    `,
    text: `Hi ${name}, Your enrollment in ${programName} has been approved! Log in to get started.`,
  });
}

/**
 * Send program holder application confirmation
 */
export async function sendProgramHolderApplicationConfirmation(
  email: string,
  organizationName: string
) {
  return sendEmail({
    to: email,
    subject: 'Program Holder Application Received',
    html: `
      <h1>Application Received</h1>
      <p>Thank you for applying to become a program holder with Elevate for Humanity.</p>
      <p><strong>Organization:</strong> ${organizationName}</p>
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Our team will review your application</li>
        <li>We'll verify your organization details</li>
        <li>You'll receive approval within 3-5 business days</li>
      </ol>
      <p>Questions? Contact us at ${ADMIN_EMAIL}</p>
    `,
    text: `Thank you for applying to become a program holder. We'll review your application and get back to you within 3-5 business days.`,
  });
}

/**
 * Send admin notification for program holder application
 */
export async function sendAdminProgramHolderNotification(
  organizationName: string,
  contactEmail: string,
  applicationId: string
) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Program Holder Application: ${organizationName}`,
    html: `
      <h1>New Program Holder Application</h1>
      <p><strong>Organization:</strong> ${organizationName}</p>
      <p><strong>Contact Email:</strong> ${contactEmail}</p>
      <p><strong>Application ID:</strong> ${applicationId}</p>
      <p><a href="https://www.elevateforhumanity.org/admin/program-holders/${applicationId}">Review Application</a></p>
    `,
    text: `New program holder application from ${organizationName} (${contactEmail})`,
  });
}

/**
 * Send document upload notification to admin
 */
export async function sendDocumentUploadNotification(
  programHolderName: string,
  documentType: string,
  documentId: string
) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Document Uploaded: ${documentType} - ${programHolderName}`,
    html: `
      <h1>New Document Uploaded</h1>
      <p><strong>Program Holder:</strong> ${programHolderName}</p>
      <p><strong>Document Type:</strong> ${documentType}</p>
      <p><a href="https://www.elevateforhumanity.org/admin/program-holder-documents">Review Documents</a></p>
    `,
    text: `${programHolderName} uploaded a ${documentType} document`,
  });
}

/**
 * Send contact form notification to admin
 */
export async function sendContactFormNotification(
  name: string,
  email: string,
  subject: string,
  message: string
) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Contact Form: ${subject}`,
    html: `
      <h1>New Contact Form Submission</h1>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
      <p><a href="mailto:${email}">Reply to ${name}</a></p>
    `,
    text: `Contact form from ${name} (${email}): ${message}`,
  });
}

/**
 * Send student acceptance notification
 */
export async function sendStudentAcceptanceNotification(
  email: string,
  studentName: string,
  programHolderName: string
) {
  return sendEmail({
    to: email,
    subject: 'Student Application Accepted',
    html: `
      <h1>Application Accepted!</h1>
      <p>Hi ${studentName},</p>
      <p>${programHolderName} has accepted your application.</p>
      <p>You can now begin your training program.</p>
      <p><a href="https://www.elevateforhumanity.org/lms/dashboard">Go to Dashboard</a></p>
    `,
    text: `Hi ${studentName}, ${programHolderName} has accepted your application.`,
  });
}

/**
 * Send student decline notification
 */
export async function sendStudentDeclineNotification(
  email: string,
  studentName: string,
  programHolderName: string,
  reason?: string
) {
  return sendEmail({
    to: email,
    subject: 'Student Application Status',
    html: `
      <h1>Application Update</h1>
      <p>Hi ${studentName},</p>
      <p>Thank you for your interest in training with ${programHolderName}.</p>
      <p>Unfortunately, we're unable to accept your application at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>You're welcome to apply to other programs on our platform.</p>
      <p><a href="https://www.elevateforhumanity.org/programs">Browse Programs</a></p>
    `,
    text: `Hi ${studentName}, Your application with ${programHolderName} was not accepted at this time.`,
  });
}
