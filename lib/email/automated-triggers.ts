import { logger } from '@/lib/logger';

/**
 * Automated Email Triggers
 * Real-time email automation based on database events
 */

import { createClient } from '@/lib/supabase/server';
import { sendEmail } from './email-service';
import { studentEmailTemplates } from './templates/student-emails';
import { appointmentEmailTemplates } from './templates/appointment-emails';

/**
 * Send application received email
 * Triggered when: New application is created
 */
export async function sendApplicationReceivedEmail(
  studentEmail: string,
  firstName: string
): Promise<boolean> {
  const template = studentEmailTemplates.applicationReceived;

  const result = await sendEmail({
    to: studentEmail,
    from: template.from,
    subject: template.subject,
    html: template.getHtml({ firstName }),
    text: template.getText({ firstName })
  });

  return result.success;
}

/**
 * Send enrollment confirmation email
 * Triggered when: Enrollment status changes to 'active'
 */
export async function sendEnrollmentConfirmationEmail(
  studentEmail: string,
  firstName: string,
  programName: string,
  startDate: string,
  format: string = 'Hybrid (Online + In-Person)',
  partnerLink?: string
): Promise<boolean> {
  const template = studentEmailTemplates.enrollmentConfirmation;

  const result = await sendEmail({
    to: studentEmail,
    from: template.from,
    subject: template.subject,
    html: template.getHtml({ firstName, programName, startDate, format, partnerLink }),
    text: template.getText({ firstName, programName, startDate, format, partnerLink })
  });

  return result.success;
}

/**
 * Send requirement reminder email
 * Triggered when: Requirement due date is approaching (3 days before)
 */
export async function sendRequirementReminderEmail(
  studentEmail: string,
  firstName: string,
  requirementTitle: string,
  dueDate: string,
  actionLink: string
): Promise<boolean> {
  const subject = `Reminder: ${requirementTitle} due soon`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p>Hi ${firstName},</p>

      <p>This is a friendly reminder that you have an upcoming requirement:</p>

      <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0;"><strong>${requirementTitle}</strong></p>
        <p style="margin: 10px 0 0 0;">Due: ${dueDate}</p>
      </div>

      <p>
        <a href="${actionLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0;">
          Complete Requirement
        </a>
      </p>

      <p>If you have questions or need assistance, call us at <a href="tel:+13173143757">(317) 314-3757</a>.</p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

      <p style="color: #666; font-size: 14px;">
        <strong>Elevate for Humanity</strong><br />
        Phone: <a href="tel:+13173143757">(317) 314-3757</a>
      </p>
    </div>
  `;

  const text = `
Hi ${firstName},

This is a friendly reminder that you have an upcoming requirement:

${requirementTitle}
Due: ${dueDate}

Complete it here: ${actionLink}

If you have questions or need assistance, call us at (317) 314-3757.

—
Elevate for Humanity
Phone: (317) 314-3757
  `;

  const result = await sendEmail({
    to: studentEmail,
    from: 'noreply@elevateforhumanity.org',
    subject,
    html,
    text
  });

  return result.success;
}

/**
 * Send overdue requirement alert
 * Triggered when: Requirement is past due date
 */
export async function sendOverdueRequirementAlert(
  studentEmail: string,
  firstName: string,
  requirementTitle: string,
  daysOverdue: number,
  actionLink: string
): Promise<boolean> {
  const subject = `Action Required: ${requirementTitle} is overdue`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p>Hi ${firstName},</p>

      <p>We noticed that you have an overdue requirement that needs your attention:</p>

      <div style="background-color: #fee2e2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0;"><strong>${requirementTitle}</strong></p>
        <p style="margin: 10px 0 0 0; color: #dc2626;">Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}</p>
      </div>

      <p>Please complete this requirement as soon as possible to stay on track with your program.</p>

      <p>
        <a href="${actionLink}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0;">
          Complete Now
        </a>
      </p>

      <p>If you're experiencing challenges or need support, please reach out to your advisor or call us at <a href="tel:+13173143757">(317) 314-3757</a>.</p>

      <p>We're here to help you succeed.</p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

      <p style="color: #666; font-size: 14px;">
        <strong>Elevate for Humanity</strong><br />
        Phone: <a href="tel:+13173143757">(317) 314-3757</a>
      </p>
    </div>
  `;

  const text = `
Hi ${firstName},

We noticed that you have an overdue requirement that needs your attention:

${requirementTitle}
Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}

Please complete this requirement as soon as possible to stay on track with your program.

Complete it here: ${actionLink}

If you're experiencing challenges or need support, please reach out to your advisor or call us at (317) 314-3757.

We're here to help you succeed.

—
Elevate for Humanity
Phone: (317) 314-3757
  `;

  const result = await sendEmail({
    to: studentEmail,
    from: 'noreply@elevateforhumanity.org',
    subject,
    html,
    text
  });

  return result.success;
}

/**
 * Send appointment confirmation email
 * Triggered when: Appointment is booked
 */
export async function sendAppointmentConfirmationEmail(
  studentEmail: string,
  firstName: string,
  appointmentType: string,
  scheduledTime: string,
  meetingLink?: string,
  phoneNumber?: string
): Promise<boolean> {
  const template = appointmentEmailTemplates.appointmentConfirmation;

  const result = await sendEmail({
    to: studentEmail,
    from: template.from,
    subject: template.subject,
    html: template.getHtml({ firstName, appointmentType, scheduledTime, meetingLink, phoneNumber }),
    text: template.getText({ firstName, appointmentType, scheduledTime, meetingLink, phoneNumber })
  });

  return result.success;
}

/**
 * Send appointment reminder (24 hours before)
 * Triggered by: Scheduled job
 */
export async function sendAppointmentReminder24Hours(
  studentEmail: string,
  firstName: string,
  appointmentType: string,
  scheduledTime: string,
  meetingLink?: string,
  phoneNumber?: string
): Promise<boolean> {
  const template = appointmentEmailTemplates.reminder24Hours;

  const result = await sendEmail({
    to: studentEmail,
    from: template.from,
    subject: template.subject,
    html: template.getHtml({ firstName, appointmentType, scheduledTime, meetingLink, phoneNumber }),
    text: template.getText({ firstName, appointmentType, scheduledTime, meetingLink, phoneNumber })
  });

  return result.success;
}

/**
 * Send appointment reminder (1 hour before)
 * Triggered by: Scheduled job
 */
export async function sendAppointmentReminder1Hour(
  studentEmail: string,
  firstName: string,
  appointmentType: string,
  scheduledTime: string,
  meetingLink?: string,
  phoneNumber?: string
): Promise<boolean> {
  const template = appointmentEmailTemplates.reminder1Hour;

  const result = await sendEmail({
    to: studentEmail,
    from: template.from,
    subject: template.subject,
    html: template.getHtml({ firstName, appointmentType, scheduledTime, meetingLink, phoneNumber }),
    text: template.getText({ firstName, appointmentType, scheduledTime, meetingLink, phoneNumber })
  });

  return result.success;
}

/**
 * Send at-risk student alert to advisor
 * Triggered when: Student risk status changes to 'at_risk'
 */
export async function sendAtRiskAlertToAdvisor(
  advisorEmail: string,
  studentName: string,
  programName: string,
  riskFactors: string[],
  dashboardLink: string
): Promise<boolean> {
  const subject = `Student Alert: ${studentName} needs support`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc2626;">Student At-Risk Alert</h2>

      <p>The following student has been flagged as at-risk and may need intervention:</p>

      <div style="background-color: #fee2e2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <p style="margin: 0;"><strong>Student:</strong> ${studentName}</p>
        <p style="margin: 10px 0 0 0;"><strong>Program:</strong> ${programName}</p>
      </div>

      <p><strong>Risk Factors:</strong></p>
      <ul>
        ${riskFactors.map(factor => `<li>${factor}</li>`).join('')}
      </ul>

      <p>
        <a href="${dashboardLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0;">
          View Student Dashboard
        </a>
      </p>

      <p>Please reach out to this student to provide support and address any barriers to success.</p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

      <p style="color: #666; font-size: 14px;">
        <strong>Elevate for Humanity</strong><br />
        Automated Alert System
      </p>
    </div>
  `;

  const text = `
STUDENT AT-RISK ALERT

The following student has been flagged as at-risk and may need intervention:

Student: ${studentName}
Program: ${programName}

Risk Factors:
${riskFactors.map(factor => `• ${factor}`).join('\n')}

View student dashboard: ${dashboardLink}

Please reach out to this student to provide support and address any barriers to success.

—
Elevate for Humanity
Automated Alert System
  `;

  const result = await sendEmail({
    to: advisorEmail,
    from: 'alerts@www.elevateforhumanity.org',
    subject,
    html,
    text
  });

  return result.success;
}

/**
 * Queue email for later delivery
 * Used by database triggers
 */
export async function queueEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  scheduledFor?: Date
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('email_queue')
    .insert({
      to_email: to,
      subject,
      html_body: html,
      text_body: text,
      scheduled_for: scheduledFor || new Date(),
      status: 'pending'
    });

  if (error) {
    logger.error('Error queueing email:', error);
    return false;
  }

  return true;
}

/**
 * Process pending emails from queue
 * Should be called by a scheduled job (cron)
 */
export async function processPendingEmails(): Promise<number> {
  const supabase = await createClient();

  // Get pending emails that are due
  const { data: emails, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50);

  if (error || !emails) {
    logger.error('Error fetching pending emails:', error);
    return 0;
  }

  let sentCount = 0;

  for (const email of emails) {
    const result = await sendEmail({
      to: email.to_email,
      subject: email.subject,
      html: email.html_body,
      text: email.text_body
    });

    if (result.success) {
      await supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          message_id: result.messageId
        })
        .eq('id', email.id);

      sentCount++;
    } else {
      await supabase
        .from('email_queue')
        .update({
          status: 'failed',
          error_message: result.error,
          retry_count: (email.retry_count || 0) + 1
        })
        .eq('id', email.id);
    }
  }

  return sentCount;
}
