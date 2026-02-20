/**
 * Appointment Confirmation Email Templates
 * Phone + Zoom appointments for students, tax clients, and partners
 */

export const appointmentEmailTemplates = {
  /**
   * Student Appointment Confirmation
   */
  studentAppointment: {
    from: 'noreply@elevateforhumanity.org',
    subject: 'Your appointment with Elevate for Humanity',
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

        <p>Your appointment with Elevate for Humanity is confirmed.</p>

        <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0;">📅 <strong>Date:</strong> ${data.date}</p>
          <p style="margin: 10px 0;">⏰ <strong>Time:</strong> ${data.time}</p>
          <p style="margin: 10px 0;">📞 <strong>Format:</strong> ${data.format === 'phone' ? 'Phone Call' : 'Zoom Video'}</p>
        </div>

        ${data.format === 'phone' ? `
          <p><strong>We will call you</strong> at the number you provided at the scheduled time.</p>
        ` : `
          <p><strong>Your secure Zoom meeting link:</strong></p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${data.zoomLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Join Zoom Meeting</a>
          </p>
          <p style="font-size: 14px; color: #666;">
            Please join from a quiet location with a stable internet connection.
          </p>
        `}

        ${data.rescheduleLink ? `
          <p>If you need to reschedule, please use <a href="${data.rescheduleLink}">this link</a> or call us at <a href="tel:+13173143757">(317) 314-3757</a>.</p>
        ` : `
          <p>If you need to reschedule, please call us at <a href="tel:+13173143757">(317) 314-3757</a>.</p>
        `}

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Elevate for Humanity</strong><br />
          Phone: <a href="tel:+13173143757">(317) 314-3757</a>
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

Your appointment with Elevate for Humanity is confirmed.

📅 Date: ${data.date}
⏰ Time: ${data.time}
📞 Format: ${data.format === 'phone' ? 'Phone Call' : 'Zoom Video'}

${data.format === 'phone'
  ? 'We will call you at the number you provided at the scheduled time.'
  : `Your secure Zoom meeting link:\n${data.zoomLink}\n\nPlease join from a quiet location with a stable internet connection.`
}

${data.rescheduleLink
  ? `If you need to reschedule, please use this link: ${data.rescheduleLink}\nOr call us at (317) 314-3757.`
  : 'If you need to reschedule, please call us at (317) 314-3757.'
}

—
Elevate for Humanity
Phone: (317) 314-3757
    `
  },

  /**
   * Appointment Reminder (24 hours before)
   */
  appointmentReminder24h: {
    from: 'noreply@elevateforhumanity.org',
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

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0;">📅 <strong>Date:</strong> ${data.date}</p>
          <p style="margin: 10px 0;">⏰ <strong>Time:</strong> ${data.time}</p>
          <p style="margin: 10px 0;">📞 <strong>Format:</strong> ${data.format === 'phone' ? 'Phone Call' : 'Zoom Video'}</p>
        </div>

        ${data.format === 'zoom' && data.zoomLink ? `
          <p style="text-align: center; margin: 20px 0;">
            <a href="${data.zoomLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Join Zoom Meeting</a>
          </p>
        ` : ''}

        ${data.rescheduleLink ? `
          <p>Need to reschedule? <a href="${data.rescheduleLink}">Click here</a> or call <a href="tel:+13173143757">(317) 314-3757</a>.</p>
        ` : ''}

        <p>We look forward to speaking with you.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Elevate for Humanity</strong><br />
          Phone: <a href="tel:+13173143757">(317) 314-3757</a>
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

${data.format === 'zoom' && data.zoomLink ? `Join Zoom Meeting: ${data.zoomLink}\n\n` : ''}${data.rescheduleLink ? `Need to reschedule? ${data.rescheduleLink}\nOr call (317) 314-3757.\n\n` : ''}We look forward to speaking with you.

—
Elevate for Humanity
Phone: (317) 314-3757
    `
  },

  /**
   * Appointment Reminder (1 hour before)
   */
  appointmentReminder1h: {
    from: 'noreply@elevateforhumanity.org',
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

        ${data.format === 'phone' ? `
          <p>We'll call you at the scheduled time.</p>
        ` : `
          <p style="text-align: center; margin: 20px 0;">
            <a href="${data.zoomLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Join Zoom Meeting</a>
          </p>
        `}

        <p>See you soon!</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Elevate for Humanity</strong><br />
          Phone: <a href="tel:+13173143757">(317) 314-3757</a>
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

${data.format === 'phone'
  ? 'We\'ll call you at the scheduled time.'
  : `Join Zoom Meeting: ${data.zoomLink}`
}

See you soon!

—
Elevate for Humanity
Phone: (317) 314-3757
    `
  }
};
