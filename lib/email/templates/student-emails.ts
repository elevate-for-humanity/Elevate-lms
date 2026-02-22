/**
 * Student / Training Email Templates
 * All templates are IRS compliant and match ecosystem tone
 */

export const studentEmailTemplates = {
  /**
   * EMAIL 1: Application Received (Auto)
   */
  applicationReceived: {
    from: 'noreply@elevateforhumanity.org',
    subject: 'We received your application — here\'s what happens next',
    getHtml: (data: { firstName: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>Thank you for applying to Elevate for Humanity. We've received your information, and there is no payment required at this time.</p>

        <p><strong>Here's what happens next:</strong></p>
        <ul>
          <li>An advisor will review your application</li>
          <li>We'll contact you within 1–2 business days</li>
          <li>We'll discuss programs, funding options, and next steps</li>
          <li>Our process is appointment-based and handled by real people</li>
        </ul>

        <p>If you have questions or need immediate assistance, you can reach us at <a href="tel:+13173143757">(317) 314-3757</a>.</p>

        <p>We're glad you took this step.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Elevate for Humanity</strong><br />
          Support: <a href="mailto:info@elevateforhumanity.org">info@elevateforhumanity.org</a><br />
          Phone: <a href="tel:+13173143757">(317) 314-3757</a>
        </p>
      </div>
    `,
    getText: (data: { firstName: string }) => `
Hello ${data.firstName},

Thank you for applying to Elevate for Humanity. We've received your information, and there is no payment required at this time.

Here's what happens next:
• An advisor will review your application
• We'll contact you within 1–2 business days
• We'll discuss programs, funding options, and next steps
• Our process is appointment-based and handled by real people

If you have questions or need immediate assistance, you can reach us at (317) 314-3757.

We're glad you took this step.

—
Elevate for Humanity
Support: info@elevateforhumanity.org
Phone: (317) 314-3757
    `
  },

  /**
   * EMAIL 2: Advisor Outreach (Manual / Assisted)
   */
  advisorOutreach: {
    from: 'advisor@www.elevateforhumanity.org',
    subject: 'Let\'s talk about your next steps',
    getHtml: (data: { firstName: string; advisorName: string; calendlyLink?: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hi ${data.firstName},</p>

        <p>My name is ${data.advisorName}, and I'm part of the Elevate for Humanity advising team.</p>

        <p><strong>I'd like to connect with you to talk about:</strong></p>
        <ul>
          <li>Your program interests</li>
          <li>Funding eligibility (WIOA, WRG, JRI, apprenticeships)</li>
          <li>Timeline and next steps</li>
        </ul>

        ${data.calendlyLink ? `
          <p>You can schedule a time that works for you here:<br />
          <a href="${data.calendlyLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0;">Schedule Appointment</a></p>
        ` : ''}

        <p>If you'd rather talk by phone, feel free to reply to this email or call us at <a href="tel:+13173143757">(317) 314-3757</a>.</p>

        <p>Looking forward to speaking with you.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          ${data.advisorName}<br />
          <strong>Elevate for Humanity</strong>
        </p>
      </div>
    `,
    getText: (data: { firstName: string; advisorName: string; calendlyLink?: string }) => `
Hi ${data.firstName},

My name is ${data.advisorName}, and I'm part of the Elevate for Humanity advising team.

I'd like to connect with you to talk about:
• Your program interests
• Funding eligibility (WIOA, WRG, JRI, apprenticeships)
• Timeline and next steps

${data.calendlyLink ? `You can schedule a time that works for you here:\n${data.calendlyLink}\n\n` : ''}If you'd rather talk by phone, feel free to reply to this email or call us at (317) 314-3757.

Looking forward to speaking with you.

—
${data.advisorName}
Elevate for Humanity
    `
  },

  /**
   * EMAIL 3: Eligibility Outcome
   */
  eligibilityOutcome: {
    from: 'noreply@elevateforhumanity.org',
    subject: 'Update on your program eligibility',
    getHtml: (data: { firstName: string; eligibilityStatus: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>We've completed an initial review of your application. Here's your current status:</p>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          ${data.eligibilityStatus}
        </div>

        <p>If additional documents are needed, your advisor will guide you through the next steps.</p>

        <p><strong>No payments are required unless discussed and approved with an advisor.</strong></p>

        <p>Thank you for working with us.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Elevate for Humanity</strong>
        </p>
      </div>
    `,
    getText: (data: { firstName: string; eligibilityStatus: string }) => `
Hello ${data.firstName},

We've completed an initial review of your application. Here's your current status:

${data.eligibilityStatus}

If additional documents are needed, your advisor will guide you through the next steps.

No payments are required unless discussed and approved with an advisor.

Thank you for working with us.

—
Elevate for Humanity
    `
  },

  /**
   * EMAIL 4: Enrollment Confirmation
   */
  enrollmentConfirmation: {
    from: 'noreply@elevateforhumanity.org',
    subject: 'You\'re enrolled — here\'s what\'s next',
    getHtml: (data: {
      firstName: string;
      programName: string;
      startDate: string;
      format: string;
      partnerLink?: string
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Congratulations ${data.firstName},</p>

        <p>You're officially enrolled in the <strong>${data.programName}</strong> program.</p>

        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0;"><strong>Program details:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Start date: ${data.startDate}</li>
            <li>Format: ${data.format}</li>
            ${data.partnerLink ? `<li>Partner access: <a href="${data.partnerLink}">Click here</a></li>` : ''}
          </ul>
        </div>

        <p>Your advisor will remain your point of contact throughout your journey.</p>

        <p>We're excited to support you.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Elevate for Humanity</strong>
        </p>
      </div>
    `,
    getText: (data: {
      firstName: string;
      programName: string;
      startDate: string;
      format: string;
      partnerLink?: string
    }) => `
Congratulations ${data.firstName},

You're officially enrolled in the ${data.programName} program.

Program details:
• Start date: ${data.startDate}
• Format: ${data.format}
${data.partnerLink ? `• Partner access: ${data.partnerLink}` : ''}

Your advisor will remain your point of contact throughout your journey.

We're excited to support you.

—
Elevate for Humanity
    `
  }
};
