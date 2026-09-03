/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

// Enhanced Payment Processing with Revenue Splits and Partner Notifications
//
// REVENUE MODEL:
// - Self-Pay Programs: 50% EFH (paid first), 50% Partners
// - Government Programs (WIOA/WRG/OJT): FREE to students, 100% to EFH, NO split
// - Instructors: NO monetary payment (credentialing only)
//
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

// Email transporter setup
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

class PaymentProcessor {
  // Process payment with automatic 50/50 split (EFH paid first)
  async processPaymentWithSplit(paymentData) {
    const {
      program_slug,
      customer_email,
      customer_name,
      amount_cents,
      partner_connect_acc,
    } = paymentData;

    try {
      // Calculate splits (50% EFH, 50% Partners)
      const efhAmount = Math.round(amount_cents * 0.5);
      const partnerAmount = amount_cents - efhAmount;


      // Create payment intent - EFH receives payment first
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount_cents,
        currency: 'usd',
        metadata: {
          program_slug,
          customer_email,
          customer_name,
          efh_amount_cents: efhAmount.toString(),
          partner_amount_cents: partnerAmount.toString(),
          partner_connect_acc,
          split_type: '50_50_efh_first',
          payment_order: 'efh_first_then_partner',
        },
      });

      return {
        success: true,
        payment_intent: paymentIntent,
        efh_amount: efhAmount,
        partner_amount: partnerAmount,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Process successful payment webhook
  async handleSuccessfulPayment(paymentIntent) {
    const metadata = paymentIntent.metadata;

    try {
      // Step 1: EFH gets paid first (already happened via Stripe)

      // Step 2: Transfer to partner (if connect account exists)
      if (metadata.partner_connect_acc && metadata.partner_connect_acc !== '') {
        await this.transferToPartner({
          amount: parseInt(metadata.partner_amount_cents),
          connect_account: metadata.partner_connect_acc,
          program_slug: metadata.program_slug,
          customer_email: metadata.customer_email,
        });
          `💸 Partner receives: $${metadata.partner_amount_cents / 100} (50%)`
        );
      }

      // Step 3: Notify partner with student details
      await this.notifyPartnerOfEnrollment({
        program_slug: metadata.program_slug,
        customer_email: metadata.customer_email,
        customer_name: metadata.customer_name,
        partner_amount: metadata.partner_amount_cents,
        payment_intent_id: paymentIntent.id,
      });

      // Step 4: Send course access to student
      await this.sendCourseAccessToStudent({
        program_slug: metadata.program_slug,
        customer_email: metadata.customer_email,
        customer_name: metadata.customer_name,
      });
    } catch (error) {
    }
  }

  // Transfer funds to partner
  async transferToPartner({
    amount,
    connect_account,
    program_slug,
    customer_email,
  }) {
    try {
      const transfer = await stripe.transfers.create({
        amount: amount,
        currency: 'usd',
        destination: connect_account,
        metadata: {
          program_slug,
          customer_email,
          transfer_type: 'partner_revenue_split',
        },
      });

        `💸 Transferred $${amount / 100} to partner: ${connect_account}`
      );
      return transfer;
    } catch (error) {
      throw error;
    }
  }

  // Notify partner of new enrollment
  async notifyPartnerOfEnrollment({
    program_slug,
    customer_email,
    customer_name,
    partner_amount,
    payment_intent_id,
  }) {
    const programs = require('./config/all-programs-with-stripe.json');
    const partners = require('./config/partners.json');

    const program = programs.find((p) => p.slug === program_slug);
    const partner = partners.find((p) => p.slug === program?.partner);

    if (!program || !partner) {
      return;
    }

    const emailContent = `
      <h2>New Student Enrollment - Payment Processed</h2>

      <h3>Program Details:</h3>
      <ul>
        <li><strong>Program:</strong> ${program.name}</li>
        <li><strong>Student:</strong> ${customer_name}</li>
        <li><strong>Email:</strong> ${customer_email}</li>
        <li><strong>Payment ID:</strong> ${payment_intent_id}</li>
      </ul>

      <h3>Revenue Information:</h3>
      <ul>
        <li><strong>Your Share (50%):</strong> $${partner_amount / 100}</li>
        <li><strong>Status:</strong> Funds transferred to your account</li>
      </ul>

      <h3>Next Steps:</h3>
      <p>Please provide course access to the student within 24 hours:</p>
      <ol>
        <li>Create student account in your LMS</li>
        <li>Send welcome email with login credentials</li>
        <li>Provide course materials and schedule</li>
      </ol>

      <p><strong>Student Contact:</strong> ${customer_email}</p>

      <hr>
      <p><small>This notification was sent automatically by the Elevate for Humanity partner system.</small></p>
    `;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: partner.supportEmail,
        subject: `New Enrollment: ${program.name} - ${customer_name}`,
        html: emailContent,
      });

    } catch (error) {
    }
  }

  // Send course access information to student
  async sendCourseAccessToStudent({
    program_slug,
    customer_email,
    customer_name,
  }) {
    const programs = require('./config/all-programs-with-stripe.json');
    const partners = require('./config/partners.json');

    const program = programs.find((p) => p.slug === program_slug);
    const partner = partners.find((p) => p.slug === program?.partner);

    if (!program || !partner) {
      return;
    }

    const emailContent = `
      <h2>Welcome to ${program.name}!</h2>

      <p>Dear ${customer_name},</p>

      <p>Thank you for enrolling in <strong>${program.name}</strong>. Your payment has been processed successfully.</p>

      <h3>Program Information:</h3>
      <ul>
        <li><strong>Program:</strong> ${program.name}</li>
        <li><strong>Provider:</strong> ${partner.name}</li>
        <li><strong>Duration:</strong> ${program.hours} hours</li>
        ${program.certification ? '<li><strong>Certification:</strong> Yes</li>' : ''}
      </ul>

      <h3>Next Steps:</h3>
      <p>Our training partner will contact you within 24 hours with:</p>
      <ol>
        <li>Course access credentials</li>
        <li>Training schedule and materials</li>
        <li>Technical requirements</li>
        <li>Support contact information</li>
      </ol>

      <h3>Support:</h3>
      <p>If you have any questions, please contact:</p>
      <ul>
        <li><strong>Training Partner:</strong> ${partner.supportEmail}</li>
        <li><strong>Platform Support:</strong> support@elevateforhumanity.org</li>
      </ul>

      <p>We're excited to support your professional development journey!</p>

      <p>Best regards,<br>
      The Elevate for Humanity Team</p>

      <hr>
      <p><small>This is an automated confirmation. Please save this email for your records.</small></p>
    `;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: customer_email,
        subject: `Enrollment Confirmed: ${program.name}`,
        html: emailContent,
      });

    } catch (error) {
    }
  }
}

module.exports = PaymentProcessor;
