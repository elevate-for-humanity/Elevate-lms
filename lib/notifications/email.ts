import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailNotification {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;
  private readonly fromEmail = process.env.EMAIL_FROM || PLATFORM_DEFAULTS.emailFromAddress;

  static getInstance() {
    if (!EmailService.instance) EmailService.instance = new EmailService();
    return EmailService.instance;
  }

  async send(notification: EmailNotification): Promise<boolean> {
    const result = await sendEmail({
      to: notification.to,
      from: notification.from || this.fromEmail,
      subject: notification.subject,
      html: notification.html,
      text: notification.text,
    });

    if (!result.success) {
      logger.error('Email send failed', new Error(result.error || 'Email delivery failed'), {
        to: notification.to,
        subject: notification.subject,
      });
      return false;
    }

    logger.info('Email sent successfully', {
      to: notification.to,
      subject: notification.subject,
      provider: 'data' in result ? result.data?.provider : 'sendgrid',
    });
    return true;
  }

  async sendWelcomeEmail(userEmail: string, userName: string) {
    return this.send(this.template(
      userEmail,
      `Welcome to ${PLATFORM_DEFAULTS.orgName}`,
      `Hello ${userName}, your account is active.`,
      'Open your learner dashboard to review your program, onboarding steps, and assigned training.',
    ));
  }

  async sendEnrollmentConfirmation(userEmail: string, userName: string, courseName: string) {
    return this.send(this.template(
      userEmail,
      `Enrollment confirmed — ${courseName}`,
      `Hello ${userName}, you are enrolled in ${courseName}.`,
      'Sign in to your learner dashboard to review orientation and assigned coursework.',
    ));
  }

  async sendAssignmentReminder(userEmail: string, userName: string, assignmentName: string, dueDate: string) {
    return this.send(this.template(
      userEmail,
      `Reminder: ${assignmentName} due ${dueDate}`,
      `Hello ${userName}, ${assignmentName} is due ${dueDate}.`,
      'Open your learner dashboard to review and submit the required work.',
    ));
  }

  async sendCertificateNotification(userEmail: string, userName: string, courseName: string, certificateUrl: string) {
    const template = this.template(
      userEmail,
      `Your ${courseName} certificate is ready`,
      `Hello ${userName}, you completed ${courseName}.`,
      `Your certificate is available here: ${certificateUrl}`,
    );
    template.html = `${template.html}<p><a href="${certificateUrl}">View certificate</a></p>`;
    return this.send(template);
  }

  async sendAchievementNotification(userEmail: string, userName: string, achievementName: string) {
    return this.send(this.template(
      userEmail,
      `Achievement earned: ${achievementName}`,
      `Hello ${userName}, you earned ${achievementName}.`,
      'Open your learner dashboard to review your progress.',
    ));
  }

  async sendDocumentUploadNotification(staffEmail: string, studentName: string, documentType: string, programName: string) {
    return this.send(this.template(
      staffEmail,
      `Document review: ${studentName} — ${documentType}`,
      `${studentName} uploaded ${documentType} for ${programName}.`,
      'Open the administrative document-review queue to review the submission.',
    ));
  }

  private template(to: string, subject: string, heading: string, body: string): EmailNotification {
    const dashboard = `${PLATFORM_DEFAULTS.siteUrl}/learner/dashboard`;
    return {
      to,
      from: this.fromEmail,
      subject,
      text: `${heading}\n\n${body}\n\n${dashboard}\n\n— ${PLATFORM_DEFAULTS.orgName}`,
      html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:600px;margin:auto;padding:24px"><h2>${heading}</h2><p>${body}</p><p><a href="${dashboard}">Open dashboard</a></p><p style="color:#64748b;font-size:13px">${PLATFORM_DEFAULTS.orgName}</p></div></body></html>`,
    };
  }
}

export const emailService = EmailService.getInstance();
