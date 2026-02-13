/**
 * Tax Services Email Templates
 * PART A: Rise Up Foundation (FREE - VITA Compliant)
 * PART B: SupersonicFastCash (PAID)
 *
 * CRITICAL: These must remain completely separated for IRS compliance
 */

// ============================================================================
// PART A: RISE UP FOUNDATION (FREE TAX - VITA)
// ============================================================================

export const riseUpFoundationEmails = {
  /**
   * EMAIL 1: Free Tax Intake Received
   */
  intakeReceived: {
    from: 'noreply@riseupfoundation.org',
    subject: 'Free tax appointment request received',
    getHtml: (data: { firstName: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>We've received your request for free tax preparation services through the Rise Up Foundation.</p>

        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0;"><strong>What happens next:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Eligibility review</li>
            <li>Appointment scheduling</li>
            <li>Document verification</li>
          </ul>
        </div>

        <p><strong>There is no cost for services provided through this program.</strong><br />
        No paid services are offered.</p>

        <p>You'll receive a follow-up shortly with scheduling details.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Rise Up Foundation</strong><br />
          Free Community Tax Services
        </p>
      </div>
    `,
    getText: (data: { firstName: string }) => `
Hello ${data.firstName},

We've received your request for free tax preparation services through the Rise Up Foundation.

What happens next:
• Eligibility review
• Appointment scheduling
• Document verification

There is no cost for services provided through this program.
No paid services are offered.

You'll receive a follow-up shortly with scheduling details.

—
Rise Up Foundation
Free Community Tax Services
    `
  },

  /**
   * EMAIL 2: Free Tax Appointment Confirmed
   */
  appointmentConfirmed: {
    from: 'noreply@riseupfoundation.org',
    subject: 'Your free tax appointment is scheduled',
    getHtml: (data: {
      firstName: string;
      date: string;
      time: string;
      location: string
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>Your free tax appointment is confirmed.</p>

        <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0;">📅 <strong>Date:</strong> ${data.date}</p>
          <p style="margin: 10px 0;">⏰ <strong>Time:</strong> ${data.time}</p>
          <p style="margin: 10px 0;">📍 <strong>Location / Virtual:</strong> ${data.location}</p>
        </div>

        <p><strong>Please bring or upload the following:</strong></p>
        <ul>
          <li>Government-issued ID</li>
          <li>Social Security card or ITIN</li>
          <li>W-2 / 1099 forms</li>
          <li>Last year's return (if available)</li>
        </ul>

        <p style="background-color: #fef3c7; padding: 10px; border-radius: 4px; font-size: 14px;">
          <strong>Note:</strong> All services are provided by trained volunteers following IRS VITA/TCE guidelines.
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Rise Up Foundation</strong>
        </p>
      </div>
    `,
    getText: (data: {
      firstName: string;
      date: string;
      time: string;
      location: string
    }) => `
Hello ${data.firstName},

Your free tax appointment is confirmed.

📅 Date: ${data.date}
⏰ Time: ${data.time}
📍 Location / Virtual: ${data.location}

Please bring or upload the following:
• Government-issued ID
• Social Security card or ITIN
• W-2 / 1099 forms
• Last year's return (if available)

All services are provided by trained volunteers following IRS VITA/TCE guidelines.

—
Rise Up Foundation
    `
  },

  /**
   * EMAIL 3: Free Tax Return Completed
   */
  returnCompleted: {
    from: 'noreply@riseupfoundation.org',
    subject: 'Your tax return has been completed',
    getHtml: (data: { firstName: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>Your tax return has been completed and submitted.</p>

        <p>You'll receive copies of your return and confirmation details during or after your appointment.</p>

        <p>Thank you for allowing us to support you.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>Rise Up Foundation</strong>
        </p>
      </div>
    `,
    getText: (data: { firstName: string }) => `
Hello ${data.firstName},

Your tax return has been completed and submitted.

You'll receive copies of your return and confirmation details during or after your appointment.

Thank you for allowing us to support you.

—
Rise Up Foundation
    `
  }
};

// ============================================================================
// PART B: SUPERSONICFASTCASH (PAID TAX SERVICES)
// ============================================================================

export const supersonicFastCashEmails = {
  /**
   * EMAIL 1: Paid Tax Appointment Confirmed
   */
  appointmentConfirmed: {
    from: 'billing@supersonicfastcash.com',
    subject: 'Your tax appointment is confirmed',
    getHtml: (data: { firstName: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>Your tax appointment with SupersonicFastCash is confirmed.</p>

        <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0;"><strong>Next steps:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Upload your documents securely</li>
            <li>We'll review the scope of your return</li>
            <li>You'll receive pricing before any payment is requested</li>
          </ul>
        </div>

        <p><strong>No charges will be processed until services are reviewed and approved.</strong></p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>SupersonicFastCash</strong>
        </p>
      </div>
    `,
    getText: (data: { firstName: string }) => `
Hello ${data.firstName},

Your tax appointment with SupersonicFastCash is confirmed.

Next steps:
• Upload your documents securely
• We'll review the scope of your return
• You'll receive pricing before any payment is requested

No charges will be processed until services are reviewed and approved.

—
SupersonicFastCash
    `
  },

  /**
   * EMAIL 2: Payment Request (Invoice)
   */
  paymentRequest: {
    from: 'billing@supersonicfastcash.com',
    subject: 'Tax preparation invoice',
    getHtml: (data: {
      firstName: string;
      amount: string;
      scopeSummary: string;
      stripeInvoiceLink: string
    }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>We've reviewed your tax information and are ready to proceed.</p>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Invoice details:</strong></p>
          <p style="margin: 10px 0;">Amount: <strong>${data.amount}</strong></p>
          <p style="margin: 10px 0;">Services included: ${data.scopeSummary}</p>
        </div>

        <p>You can securely complete payment here:</p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${data.stripeInvoiceLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Pay Invoice</a>
        </p>

        <p style="background-color: #fef3c7; padding: 10px; border-radius: 4px; font-size: 14px;">
          Please review our refund and service policies before submitting payment.
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>SupersonicFastCash</strong><br />
          Professional Tax Preparation Services
        </p>
      </div>
    `,
    getText: (data: {
      firstName: string;
      amount: string;
      scopeSummary: string;
      stripeInvoiceLink: string
    }) => `
Hello ${data.firstName},

We've reviewed your tax information and are ready to proceed.

Invoice details:
• Amount: ${data.amount}
• Services included: ${data.scopeSummary}

You can securely complete payment here:
${data.stripeInvoiceLink}

Please review our refund and service policies before submitting payment.

—
SupersonicFastCash
Professional Tax Preparation Services
    `
  },

  /**
   * EMAIL 3: Payment Confirmation
   */
  paymentConfirmation: {
    from: 'billing@supersonicfastcash.com',
    subject: 'Payment received — next steps',
    getHtml: (data: { firstName: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hello ${data.firstName},</p>

        <p>We've received your payment. Thank you.</p>

        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0;"><strong>Next steps:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Final review</li>
            <li>Filing submission</li>
            <li>Confirmation delivery</li>
          </ul>
        </div>

        <p>We'll keep you updated throughout the process.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="color: #666; font-size: 14px;">
          <strong>SupersonicFastCash</strong>
        </p>
      </div>
    `,
    getText: (data: { firstName: string }) => `
Hello ${data.firstName},

We've received your payment. Thank you.

Next steps:
• Final review
• Filing submission
• Confirmation delivery

We'll keep you updated throughout the process.

—
SupersonicFastCash
    `
  }
};
