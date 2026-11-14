import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Student / Training Email Templates
 * All templates are IRS compliant and match ecosystem tone
 */

export const studentEmailTemplates = {
  /**
   * EMAIL 1: Application Received (Auto)
   */
  applicationReceived: {
    from: PLATFORM_DEFAULTS.emailFromAddress,
    subject: "We received your application — here's what happens next",
    getHtml: (data: { firstName: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>Thank you for applying to ${PLATFORM_DEFAULTS.orgName}. We've received your information, and there is no payment required at this time.</p>

        <p><strong>Here's what happens next:</strong></p>
        <ul>
          <li>An advisor will review your application</li>
          <li>We'll contact you within 1–2 business days</li>
          <li>We'll discuss programs, funding options, and next steps</li>
          <li>Our process is appointment-based and handled by real people</li>
        </ul>

        <p>If you have questions or need immediate assistance, you can reach us at <a href="tel:+1${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a>.</p>

        <p>We're glad you took this step.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>${PLATFORM_DEFAULTS.orgName}</strong><br />
          Support: <a href="mailto:info@${PLATFORM_DEFAULTS.canonicalDomain}">info@${PLATFORM_DEFAULTS.canonicalDomain}</a><br />
          Phone: <a href="tel:+1${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a>
        </p>
      </div>
    `,
    getText: (data: { firstName: string }) => `
Hello ${data.firstName},

Thank you for applying to ${PLATFORM_DEFAULTS.orgName}. We've received your information, and there is no payment required at this time.

Here's what happens next:
• An advisor will review your application
• We'll contact you within 1–2 business days
• We'll discuss programs, funding options, and next steps
• Our process is appointment-based and handled by real people

If you have questions or need immediate assistance, you can reach us at ${PLATFORM_DEFAULTS.supportPhone}.

We're glad you took this step.

—
${PLATFORM_DEFAULTS.orgName}
Support: info@${PLATFORM_DEFAULTS.canonicalDomain}
Phone: ${PLATFORM_DEFAULTS.supportPhone}
    `,
  },

  /**
   * EMAIL 2: Advisor Outreach (Manual / Assisted)
   */
  advisorOutreach: {
    from: `advisor@${PLATFORM_DEFAULTS.canonicalDomain}`,
    subject: "Let's talk about your next steps",
    getHtml: (data: { firstName: string; advisorName: string; calendlyLink?: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hi ${data.firstName},</p>

        <p>My name is ${data.advisorName}, and I'm part of the ${PLATFORM_DEFAULTS.orgName} advising team.</p>

        <p><strong>I'd like to connect with you to talk about:</strong></p>
        <ul>
          <li>Your program interests</li>
          <li>Funding eligibility (WIOA, WRG, JRI, apprenticeships)</li>
          <li>Timeline and next steps</li>
        </ul>

        ${
          data.calendlyLink
            ? `
          <p>You can schedule a time that works for you here:<br />
          <a href="${data.calendlyLink}" style="display: inline-block; padding: 12px 24px; background-color: #ea580c; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0;">Schedule Appointment</a></p>
        `
            : ''
        }

        <p>If you'd rather talk by phone, feel free to reply to this email or call us at <a href="tel:+1${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a>.</p>

        <p>Looking forward to speaking with you.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          ${data.advisorName}<br />
          <strong>${PLATFORM_DEFAULTS.orgName}</strong>
        </p>
      </div>
    `,
    getText: (data: { firstName: string; advisorName: string; calendlyLink?: string }) => `
Hi ${data.firstName},

My name is ${data.advisorName}, and I'm part of the ${PLATFORM_DEFAULTS.orgName} advising team.

I'd like to connect with you to talk about:
• Your program interests
• Funding eligibility (WIOA, WRG, JRI, apprenticeships)
• Timeline and next steps

${data.calendlyLink ? `You can schedule a time that works for you here:\n${data.calendlyLink}\n\n` : ''}If you'd rather talk by phone, feel free to reply to this email or call us at ${PLATFORM_DEFAULTS.supportPhone}.

Looking forward to speaking with you.

—
${data.advisorName}
${PLATFORM_DEFAULTS.orgName}
    `,
  },

  /**
   * EMAIL 3: Eligibility Outcome
   */
  eligibilityOutcome: {
    from: PLATFORM_DEFAULTS.emailFromAddress,
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
          <strong>${PLATFORM_DEFAULTS.orgName}</strong>
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
${PLATFORM_DEFAULTS.orgName}
    `,
  },

  /**
   * EMAIL 4: Enrollment Confirmation
   */
  enrollmentConfirmation: {
    from: PLATFORM_DEFAULTS.emailFromAddress,
    subject: "You're enrolled — here's what's next",
    getHtml: (data: {
      firstName: string;
      programName: string;
      startDate: string;
      format: string;
      partnerLink?: string;
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Congratulations ${data.firstName},</p>

        <p>You're officially enrolled in the <strong>${data.programName}</strong> program.</p>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
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
          <strong>${PLATFORM_DEFAULTS.orgName}</strong>
        </p>
      </div>
    `,
    getText: (data: {
      firstName: string;
      programName: string;
      startDate: string;
      format: string;
      partnerLink?: string;
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
${PLATFORM_DEFAULTS.orgName}
    `,
  },
};
