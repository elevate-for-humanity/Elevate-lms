// Email notification system - PRODUCTION ENFORCED
// All email delivery routes through Resend. No mock implementations.
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';

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
  private fromEmail: string;

  private constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'info@elevateforhumanity.org';
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * PRODUCTION EMAIL SENDER
   * Routes all email through Resend via lib/email.ts
   * Throws on misconfiguration - no silent failures
   */
  async send(notification: EmailNotification): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      const error = new Error('SENDGRID_API_KEY is not configured. Email cannot be sent.');
      logger.error('Email configuration error', error);
      throw error;
    }

    try {
      const result = await sendEmail({
        to: notification.to,
        subject: notification.subject,
        html: notification.html,
      });

      if (!result.success) {
        logger.error('Email send failed', new Error(result.error || 'Unknown error'), {
          to: notification.to,
          subject: notification.subject,
        });
        return false;
      }

      logger.info('Email sent successfully', {
        to: notification.to,
        subject: notification.subject,
        messageId: result.messageId,
      });
      return true;
    } catch (error) {
      logger.error('Email send error', error as Error, {
        to: notification.to,
        subject: notification.subject,
      });
      throw error;
    }
  }

  // Welcome email
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    const template = this.getWelcomeTemplate(userName);
    return this.send({
      to: userEmail,
      from: this.fromEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Course enrollment confirmation
  async sendEnrollmentConfirmation(
    userEmail: string,
    userName: string,
    courseName: string
  ): Promise<boolean> {
    const template = this.getEnrollmentTemplate(userName, courseName);
    return this.send({
      to: userEmail,
      from: this.fromEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Assignment due reminder
  async sendAssignmentReminder(
    userEmail: string,
    userName: string,
    assignmentName: string,
    dueDate: string
  ): Promise<boolean> {
    const template = this.getAssignmentReminderTemplate(userName, assignmentName, dueDate);
    return this.send({
      to: userEmail,
      from: this.fromEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Certificate issued
  async sendCertificateNotification(
    userEmail: string,
    userName: string,
    courseName: string,
    certificateUrl: string
  ): Promise<boolean> {
    const template = this.getCertificateTemplate(userName, courseName, certificateUrl);
    return this.send({
      to: userEmail,
      from: this.fromEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Achievement unlocked
  async sendAchievementNotification(
    userEmail: string,
    userName: string,
    achievementName: string
  ): Promise<boolean> {
    const template = this.getAchievementTemplate(userName, achievementName);
    return this.send({
      to: userEmail,
      from: this.fromEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Staff notification for document upload
  async sendDocumentUploadNotification(
    staffEmail: string,
    studentName: string,
    documentType: string,
    programName: string
  ): Promise<boolean> {
    const template = this.getDocumentUploadTemplate(studentName, documentType, programName);
    return this.send({
      to: staffEmail,
      from: this.fromEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Email templates — clean, minimal, no gradients
  private wrap(body: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #ffffff;"><div style="max-width: 580px; margin: 0 auto; padding: 40px 20px;"><div style="margin-bottom: 32px;"><p style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin: 0;">Elevate for Humanity</p></div><div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px;">${body}</div><div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;"><p style="margin: 0 0 4px;">Elevate for Humanity</p><p style="margin: 0 0 4px;">Phone: <a href="tel:+13173143757" style="color: #6b7280;">(317) 314-3757</a></p><p style="margin: 0 0 4px;">Email: <a href="mailto:info@elevateforhumanity.org" style="color: #6b7280;">info@elevateforhumanity.org</a></p><p style="margin: 12px 0 0; font-size: 12px; color: #9ca3af;">&copy; ${new Date().getFullYear()} Elevate for Humanity. All rights reserved.</p></div></div></body></html>`;
  }

  private btn(url: string, label: string): string {
    return `<a href="${url}" style="display: inline-block; padding: 12px 28px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">${label}</a>`;
  }

  private getWelcomeTemplate(userName: string): EmailTemplate {
    return {
      subject: 'Welcome to Elevate for Humanity',
      html: this.wrap(`
        <p style="margin: 0 0 16px;">Hello ${userName},</p>
        <p style="margin: 0 0 16px;">Your account is active. Here's what you have access to:</p>
        <ul style="margin: 0 0 16px; padding-left: 20px;">
          <li style="margin: 6px 0;">Funded training programs at no cost to you</li>
          <li style="margin: 6px 0;">Industry-recognized certifications</li>
          <li style="margin: 6px 0;">Career placement support</li>
          <li style="margin: 6px 0;">Dedicated advisor throughout your program</li>
        </ul>
        <p style="margin: 0 0 24px;">Log in to your student portal to get started.</p>
        <div style="margin: 0 0 16px;">${this.btn('https://www.elevateforhumanity.org/learner/dashboard', 'Go to Student Portal')}</div>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Questions? Reply to this email or call (317) 314-3757.</p>
      `),
      text: `Hello ${userName},\n\nYour Elevate for Humanity account is active. Log in to get started.\n\nhttps://www.elevateforhumanity.org/learner/dashboard\n\n— Elevate for Humanity`,
    };
  }

  private getEnrollmentTemplate(userName: string, courseName: string): EmailTemplate {
    return {
      subject: `Enrollment confirmed — ${courseName}`,
      html: this.wrap(`
        <p style="margin: 0 0 16px;">Hello ${userName},</p>
        <p style="margin: 0 0 16px;">You are enrolled in <strong>${courseName}</strong>.</p>
        <p style="margin: 0 0 8px;"><strong>Next steps:</strong></p>
        <ol style="margin: 0 0 16px; padding-left: 20px;">
          <li style="margin: 6px 0;">Log in to the student portal</li>
          <li style="margin: 6px 0;">Complete the orientation module</li>
          <li style="margin: 6px 0;">Begin your coursework</li>
        </ol>
        <p style="margin: 0 0 24px;">Your advisor will be in touch with any additional details.</p>
        <div style="margin: 0 0 16px;">${this.btn('https://www.elevateforhumanity.org/learner/dashboard', 'Start Learning')}</div>
      `),
      text: `Hello ${userName},\n\nYou are enrolled in ${courseName}.\n\nNext steps:\n1. Log in to the student portal\n2. Complete the orientation module\n3. Begin your coursework\n\n— Elevate for Humanity`,
    };
  }

  private getAssignmentReminderTemplate(
    userName: string,
    assignmentName: string,
    dueDate: string
  ): EmailTemplate {
    return {
      subject: `Reminder: ${assignmentName} due ${dueDate}`,
      html: this.wrap(`
        <p style="margin: 0 0 16px;">Hello ${userName},</p>
        <p style="margin: 0 0 16px;"><strong>${assignmentName}</strong> is due on <strong>${dueDate}</strong>.</p>
        <p style="margin: 0 0 24px;">Make sure you've reviewed the requirements and submitted your work before the deadline.</p>
        <div style="margin: 0 0 16px;">${this.btn('https://www.elevateforhumanity.org/learner/dashboard', 'View Assignment')}</div>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Need help? Contact your instructor or advisor.</p>
      `),
      text: `Hello ${userName},\n\n${assignmentName} is due on ${dueDate}. Submit before the deadline.\n\n— Elevate for Humanity`,
    };
  }

  private getCertificateTemplate(
    userName: string,
    courseName: string,
    certificateUrl: string
  ): EmailTemplate {
    return {
      subject: `Your ${courseName} certificate is ready`,
      html: this.wrap(`
        <p style="margin: 0 0 16px;">Hello ${userName},</p>
        <p style="margin: 0 0 16px;">You have completed <strong>${courseName}</strong>. Your certificate is ready for download.</p>
        <div style="margin: 0 0 24px;">${this.btn(certificateUrl, 'Download Certificate')}</div>
        <p style="margin: 0 0 16px;">This certificate is verifiable through our platform. You can share it with employers or add it to your LinkedIn profile.</p>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Congratulations on completing the program.</p>
      `),
      text: `Hello ${userName},\n\nYou have completed ${courseName}. Your certificate is ready:\n\n${certificateUrl}\n\n— Elevate for Humanity`,
    };
  }

  private getAchievementTemplate(userName: string, achievementName: string): EmailTemplate {
    return {
      subject: `Achievement earned: ${achievementName}`,
      html: this.wrap(`
        <p style="margin: 0 0 16px;">Hello ${userName},</p>
        <p style="margin: 0 0 16px;">You've earned the <strong>${achievementName}</strong> achievement.</p>
        <p style="margin: 0 0 24px;">View your achievements in the student portal.</p>
        <div style="margin: 0 0 16px;">${this.btn('https://www.elevateforhumanity.org/learner/dashboard', 'View Achievements')}</div>
      `),
      text: `Hello ${userName},\n\nYou've earned the ${achievementName} achievement.\n\n— Elevate for Humanity`,
    };
  }

  private getDocumentUploadTemplate(
    studentName: string,
    documentType: string,
    programName: string
  ): EmailTemplate {
    return {
      subject: `Document review: ${studentName} — ${documentType}`,
      html: this.wrap(`
        <p style="margin: 0 0 16px;">A student has uploaded a document for review.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; width: 140px;">Student</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${studentName}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Document</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${documentType}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Program</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${programName}</td></tr>
        </table>
        <div style="margin: 0 0 16px;">${this.btn('https://www.elevateforhumanity.org/admin/documents/review', 'Review Document')}</div>
      `),
      text: `Document review required.\n\nStudent: ${studentName}\nDocument: ${documentType}\nProgram: ${programName}\n\nhttps://www.elevateforhumanity.org/admin/documents/review\n\n— Elevate for Humanity`,
    };
  }
}

export const emailService = EmailService.getInstance();
