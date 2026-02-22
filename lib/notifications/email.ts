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
    if (!process.env.RESEND_API_KEY) {
      const error = new Error('RESEND_API_KEY is not configured. Email cannot be sent.');
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

  // Email templates
  private getWelcomeTemplate(userName: string): EmailTemplate {
    return {
      subject: 'Welcome to Elevate for Humanity!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to Elevate!</h1>
          </div>
          <div style="padding: 40px; background: #ffffff;">
            <h2>Hi ${userName},</h2>
            <p>We're thrilled to have you join our community of learners!</p>
            <p>You now have access to:</p>
            <ul>
              <li>100% funded training programs</li>
              <li>Expert instructors and mentors</li>
              <li>Career placement support</li>
              <li>Industry-recognized certifications</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://www.elevateforhumanity.org/lms/dashboard" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Get Started
              </a>
            </div>
            <p>If you have any questions, our support team is here to help!</p>
            <p>Best regards,<br>The Elevate Team</p>
          </div>
        </div>
      `,
      text: `Hi ${userName}, Welcome to Elevate for Humanity! We're thrilled to have you join our community of learners.`,
    };
  }

  private getEnrollmentTemplate(userName: string, courseName: string): EmailTemplate {
    return {
      subject: `You're enrolled in ${courseName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Enrollment Confirmed!</h1>
          </div>
          <div style="padding: 40px; background: #ffffff;">
            <h2>Hi ${userName},</h2>
            <p>Great news! You're now enrolled in <strong>${courseName}</strong>.</p>
            <p>Here's what happens next:</p>
            <ol>
              <li>Access your course materials in the student portal</li>
              <li>Complete the orientation module</li>
              <li>Join your cohort's study group</li>
              <li>Start learning!</li>
            </ol>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://www.elevateforhumanity.org/lms/courses" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Start Learning
              </a>
            </div>
            <p>Best regards,<br>The Elevate Team</p>
          </div>
        </div>
      `,
      text: `Hi ${userName}, You're now enrolled in ${courseName}! Access your course materials in the student portal.`,
    };
  }

  private getAssignmentReminderTemplate(
    userName: string,
    assignmentName: string,
    dueDate: string
  ): EmailTemplate {
    return {
      subject: `Reminder: ${assignmentName} due soon`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f97316; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Assignment Reminder</h1>
          </div>
          <div style="padding: 40px; background: #ffffff;">
            <h2>Hi ${userName},</h2>
            <p>This is a friendly reminder that <strong>${assignmentName}</strong> is due on <strong>${dueDate}</strong>.</p>
            <p>Don't forget to:</p>
            <ul>
              <li>Review the assignment requirements</li>
              <li>Complete all sections</li>
              <li>Submit before the deadline</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://www.elevateforhumanity.org/lms/assignments" style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                View Assignment
              </a>
            </div>
            <p>Need help? Reach out to your instructor or study group!</p>
            <p>Best regards,<br>The Elevate Team</p>
          </div>
        </div>
      `,
      text: `Hi ${userName}, Reminder: ${assignmentName} is due on ${dueDate}. Submit before the deadline!`,
    };
  }

  private getCertificateTemplate(
    userName: string,
    courseName: string,
    certificateUrl: string
  ): EmailTemplate {
    return {
      subject: `Your ${courseName} Certificate is Ready!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #f97316 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Congratulations!</h1>
          </div>
          <div style="padding: 40px; background: #ffffff;">
            <h2>Hi ${userName},</h2>
            <p>Congratulations on completing <strong>${courseName}</strong>!</p>
            <p>Your certificate is now available for download. Share it on LinkedIn to showcase your achievement!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${certificateUrl}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Download Certificate
              </a>
            </div>
            <p>We're proud of your accomplishment and excited to see where your new skills take you!</p>
            <p>Best regards,<br>The Elevate Team</p>
          </div>
        </div>
      `,
      text: `Hi ${userName}, Congratulations on completing ${courseName}! Your certificate is ready: ${certificateUrl}`,
    };
  }

  private getAchievementTemplate(userName: string, achievementName: string): EmailTemplate {
    return {
      subject: `Achievement Unlocked: ${achievementName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Achievement Unlocked!</h1>
          </div>
          <div style="padding: 40px; background: #ffffff;">
            <h2>Hi ${userName},</h2>
            <p>You've unlocked the <strong>${achievementName}</strong> achievement!</p>
            <p>Keep up the great work and continue your learning journey!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://www.elevateforhumanity.org/lms/achievements" style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                View All Achievements
              </a>
            </div>
            <p>Best regards,<br>The Elevate Team</p>
          </div>
        </div>
      `,
      text: `Hi ${userName}, You've unlocked the ${achievementName} achievement! Keep up the great work!`,
    };
  }

  private getDocumentUploadTemplate(
    studentName: string,
    documentType: string,
    programName: string
  ): EmailTemplate {
    return {
      subject: `Document Review Required: ${studentName} - ${documentType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Document Review Required</h1>
          </div>
          <div style="padding: 40px; background: #ffffff;">
            <h2>New Document Upload</h2>
            <p>A student has uploaded a document that requires review:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Student:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${studentName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Document Type:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${documentType}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Program:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${programName}</td>
              </tr>
            </table>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://www.elevateforhumanity.org/admin/documents/review" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Review Document
              </a>
            </div>
            <p>Please review and approve or reject this document.</p>
          </div>
        </div>
      `,
      text: `New document upload from ${studentName}: ${documentType} for ${programName}. Review at https://www.elevateforhumanity.org/admin/documents/review`,
    };
  }
}

export const emailService = EmailService.getInstance();
