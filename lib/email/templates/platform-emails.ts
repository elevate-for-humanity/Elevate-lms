import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Platform / Licensing Email Templates
 * For organizations interested in licensing the Elevate platform
 */

export const platformEmailTemplates = {
  /**
   * EMAIL 1: Platform Inquiry Received
   */
  inquiryReceived: {
    from: PLATFORM_DEFAULTS.emailFromAddress,
    subject: 'Platform inquiry received',
    getHtml: (data: { name: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.name},</p>

        <p>Thank you for your interest in the ${PLATFORM_DEFAULTS.orgName} platform.</p>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
          <p style="margin: 0;"><strong>We'll review your inquiry and follow up to:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Discuss your use case</li>
            <li>Schedule a demo</li>
            <li>Review licensing options</li>
          </ul>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>${PLATFORM_DEFAULTS.orgName}</strong>
        </p>
      </div>
    `,
    getText: (data: { name: string }) => `
Hello ${data.name},

Thank you for your interest in the ${PLATFORM_DEFAULTS.orgName} platform.

We'll review your inquiry and follow up to:
• Discuss your use case
• Schedule a demo
• Review licensing options

—
${PLATFORM_DEFAULTS.orgName}
    `,
  },

  /**
   * EMAIL 2: Licensing Proposal
   */
  licensingProposal: {
    from: `partnerships@${PLATFORM_DEFAULTS.canonicalDomain}`,
    subject: 'Platform licensing proposal',
    getHtml: (data: { name: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.name},</p>

        <p>Attached is your platform licensing proposal, including:</p>

        <ul>
          <li>Scope and features</li>
          <li>Compliance considerations</li>
          <li>Pricing and onboarding timeline</li>
        </ul>

        <p>Please review and let us know if you'd like to proceed.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>${PLATFORM_DEFAULTS.orgName}</strong>
        </p>
      </div>
    `,
    getText: (data: { name: string }) => `
Hello ${data.name},

Attached is your platform licensing proposal, including:
• Scope and features
• Compliance considerations
• Pricing and onboarding timeline

Please review and let us know if you'd like to proceed.

—
${PLATFORM_DEFAULTS.orgName}
    `,
  },

  /**
   * EMAIL 3: Platform Payment Confirmation
   */
  paymentConfirmation: {
    from: PLATFORM_DEFAULTS.emailFromAddress,
    subject: 'Platform access & onboarding details',
    getHtml: (data: { name: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.name},</p>

        <p>We've received your payment.</p>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e5e7eb;">
          <p style="margin: 0;"><strong>Next steps:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Account provisioning</li>
            <li>Onboarding session scheduling</li>
            <li>Access credentials delivery</li>
          </ul>
        </div>

        <p>Welcome aboard.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>${PLATFORM_DEFAULTS.orgName}</strong>
        </p>
      </div>
    `,
    getText: (data: { name: string }) => `
Hello ${data.name},

We've received your payment.

Next steps:
• Account provisioning
• Onboarding session scheduling
• Access credentials delivery

Welcome aboard.

—
${PLATFORM_DEFAULTS.orgName}
    `,
  },
};
