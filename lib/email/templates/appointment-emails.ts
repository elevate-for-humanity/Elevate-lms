import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Appointment Confirmation Email Templates
 * Phone + Zoom appointments for students, tax clients, and partners
 */

export const appointmentEmailTemplates = {
  /**
   * Student Appointment Confirmation
   */
  studentAppointment: {
    from: PLATFORM_DEFAULTS.emailFromAddress,
    subject: 'Your appointment with ' + PLATFORM_DEFAULTS.orgName + '',
    getHtml: (data: {
      firstName: string;
      date: string;
      time: string;
      format: 'phone' | 'zoom';
      zoomLink?: string;
      rescheduleLink?: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>Your appointment with ${PLATFORM_DEFAULTS.orgName} is confirmed.</p>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
          <p style="margin: 0;">📅 <strong>Date:</strong> ${data.date}</p>
          <p style="margin: 10px 0;">⏰ <strong>Time:</strong> ${data.time}</p>
          <p style="margin: 10px 0;">📞 <strong>Format:</strong> ${data.format === 'phone' ? 'Phone Call' : 'Zoom Video'}</p>
        </div>

        ${
          data.format === 'phone'
            ? `
          <p><strong>We will call you</strong> at the number you provided at the scheduled time.</p>
        `
            : `
          <p><strong>Your secure Zoom meeting link:</strong></p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${data.zoomLink}" style="display: inline-block; padding: 12px 24px; background-color: #ea580c; color: white; text-decoration: none; border-radius: 6px;">Join Zoom Meeting</a>
          </p>
          <p style="font-size: 14px; color: #666;">
            Please join from a quiet location with a stable internet connection.
          </p>
        `
        }

        ${
          data.rescheduleLink
            ? `
          <p>If you need to reschedule, please use <a href="${data.rescheduleLink}">this link</a> or call us at <a href="tel:+1${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a>.</p>
        `
            : `
          <p>If you need to reschedule, please call us at <a href="tel:+1${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a>.</p>
        `
        }

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>${PLATFORM_DEFAULTS.orgName}</strong><br />
          Phone: <a href="tel:+1${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a>
        </p>
      </div>
    `,
    getText: (data: {
      firstName: string;
      date: string;
      time: string;
      format: 'phone' | 'zoom';
      zoomLink?: string;
      rescheduleLink?: string;
    }) => `
Hello ${data.firstName},

Your appointment with ${PLATFORM_DEFAULTS.orgName} is confirmed.

📅 Date: ${data.date}
⏰ Time: ${data.time}
📞 Format: ${data.format === 'phone' ? 'Phone Call' : 'Zoom Video'}

${
  data.format === 'phone'
    ? 'We will call you at the number you provided at the scheduled time.'
    : `Your secure Zoom meeting link:\n${data.zoomLink}\n\nPlease join from a quiet location with a stable internet connection.`
}

${
  data.rescheduleLink
    ? `If you need to reschedule, please use this link: ${data.rescheduleLink}\nOr call us at ${PLATFORM_DEFAULTS.supportPhone}.`
    : `If you need to reschedule, please call us at ${PLATFORM_DEFAULTS.supportPhone}.`
}

—
${PLATFORM_DEFAULTS.orgName}
Phone: ${PLATFORM_DEFAULTS.supportPhone}
    `,
  },

  /**
   * Appointment Reminder (24 hours before)
   */
  appointmentReminder24h: {
    from: PLATFORM_DEFAULTS.emailFromAddress,
    subject: 'Reminder: Your appointment tomorrow',
    getHtml: (data: {
      firstName: string;
      date: string;
      time: string;
      format: 'phone' | 'zoom';
      zoomLink?: string;
      rescheduleLink?: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>This is a reminder about your appointment tomorrow.</p>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
          <p style="margin: 0;">📅 <strong>Date:</strong> ${data.date}</p>
          <p style="margin: 10px 0;">⏰ <strong>Time:</strong> ${data.time}</p>
          <p style="margin: 10px 0;">📞 <strong>Format:</strong> ${data.format === 'phone' ? 'Phone Call' : 'Zoom Video'}</p>
        </div>

        ${
          data.format === 'zoom' && data.zoomLink
            ? `
          <p style="text-align: center; margin: 20px 0;">
            <a href="${data.zoomLink}" style="display: inline-block; padding: 12px 24px; background-color: #ea580c; color: white; text-decoration: none; border-radius: 6px;">Join Zoom Meeting</a>
          </p>
        `
            : ''
        }

        ${
          data.rescheduleLink
            ? `
          <p>Need to reschedule? <a href="${data.rescheduleLink}">Click here</a> or call <a href="tel:+1${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a>.</p>
        `
            : ''
        }

        <p>We look forward to speaking with you.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>${PLATFORM_DEFAULTS.orgName}</strong><br />
          Phone: <a href="tel:+1${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a>
        </p>
      </div>
    `,
    getText: (data: {
      firstName: string;
      date: string;
      time: string;
      format: 'phone' | 'zoom';
      zoomLink?: string;
      rescheduleLink?: string;
    }) => `
Hello ${data.firstName},

This is a reminder about your appointment tomorrow.

📅 Date: ${data.date}
⏰ Time: ${data.time}
📞 Format: ${data.format === 'phone' ? 'Phone Call' : 'Zoom Video'}

${data.format === 'zoom' && data.zoomLink ? `Join Zoom Meeting: ${data.zoomLink}\n\n` : ''}${data.rescheduleLink ? `Need to reschedule? ${data.rescheduleLink}\nOr call ${PLATFORM_DEFAULTS.supportPhone}.\n\n` : ''}We look forward to speaking with you.

—
${PLATFORM_DEFAULTS.orgName}
Phone: ${PLATFORM_DEFAULTS.supportPhone}
    `,
  },

  /**
   * Appointment Reminder (1 hour before)
   */
  appointmentReminder1h: {
    from: PLATFORM_DEFAULTS.emailFromAddress,
    subject: 'Starting soon: Your appointment in 1 hour',
    getHtml: (data: {
      firstName: string;
      time: string;
      format: 'phone' | 'zoom';
      zoomLink?: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p><strong>Your appointment starts in 1 hour</strong> at ${data.time}.</p>

        ${
          data.format === 'phone'
            ? `
          <p>We'll call you at the scheduled time.</p>
        `
            : `
          <p style="text-align: center; margin: 20px 0;">
            <a href="${data.zoomLink}" style="display: inline-block; padding: 12px 24px; background-color: #ea580c; color: white; text-decoration: none; border-radius: 6px;">Join Zoom Meeting</a>
          </p>
        `
        }

        <p>See you soon!</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>${PLATFORM_DEFAULTS.orgName}</strong><br />
          Phone: <a href="tel:+1${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a>
        </p>
      </div>
    `,
    getText: (data: {
      firstName: string;
      time: string;
      format: 'phone' | 'zoom';
      zoomLink?: string;
    }) => `
Hello ${data.firstName},

Your appointment starts in 1 hour at ${data.time}.

${
  data.format === 'phone'
    ? "We'll call you at the scheduled time."
    : `Join Zoom Meeting: ${data.zoomLink}`
}

See you soon!

—
${PLATFORM_DEFAULTS.orgName}
Phone: ${PLATFORM_DEFAULTS.supportPhone}
    `,
  },
};
