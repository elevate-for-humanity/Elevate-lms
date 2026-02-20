/**
 * Platform / Licensing Email Templates
 * For organizations interested in licensing the Elevate platform
 */

export const platformEmailTemplates = {
  /**
   * EMAIL 1: Platform Inquiry Received
   */
  inquiryReceived: {
    from: 'noreply@elevateforhumanity.org',
    subject: 'Platform inquiry received',
    getHtml: (data: { name: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.name},</p>

        <p>Thank you for your interest in the Elevate for Humanity platform.</p>

        <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0;"><strong>We'll review your inquiry and follow up to:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Discuss your use case</li>
            <li>Schedule a demo</li>
            <li>Review licensing options</li>
          </ul>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Elevate for Humanity</strong>
        </p>
      </div>
    `,
    getText: (data: { name: string }) => `
Hello ${data.name},

Thank you for your interest in the Elevate for Humanity platform.

We'll review your inquiry and follow up to:
• Discuss your use case
• Schedule a demo
• Review licensing options

—
Elevate for Humanity
    `
  },

  /**
   * EMAIL 2: Licensing Proposal
   */
  licensingProposal: {
    from: 'partnerships@www.elevateforhumanity.org',
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
          <strong>Elevate for Humanity</strong>
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
Elevate for Humanity
    `
  },

  /**
   * EMAIL 3: Platform Payment Confirmation
   */
  paymentConfirmation: {
    from: 'noreply@elevateforhumanity.org',
    subject: 'Platform access & onboarding details',
    getHtml: (data: { name: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.name},</p>

        <p>We've received your payment.</p>

        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
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
          <strong>Elevate for Humanity</strong>
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
Elevate for Humanity
    `
  }
};
