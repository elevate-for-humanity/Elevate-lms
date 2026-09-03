/**
 * REVENUE SPLIT SYSTEM
 * Automated 50/50 revenue sharing with credentialing partners
 *
 * REVENUE MODEL:
 * - Self-Pay Programs: 50% EFH (paid first), 50% Partners
 * - Government Programs (WIOA/WRG/OJT): FREE to students, 100% to EFH, NO split
 * - Instructors: NO monetary payment (credentialing only)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const partnerCatalog = require('./partner-programs-catalog.json');

class RevenueSplitSystem {
  constructor() {
    this.stripe = stripe;
    this.catalog = partnerCatalog;
    this.partnerAccounts = new Map(); // Cache for partner Stripe accounts
  }

  /**
   * Process enrollment payment with automatic revenue split
   */
  async processEnrollmentPayment(enrollmentData) {
    const { programId, partnerId, studentEmail, studentName, paymentMethodId } =
      enrollmentData;

    try {
      // Get program details
      const program = this.getProgramDetails(partnerId, programId);
      if (!program) {
        throw new Error(
          `Program ${programId} not found for partner ${partnerId}`
        );
      }

      // Get or create partner Connect account
      const partnerAccount = await this.getPartnerAccount(partnerId);

      // Calculate revenue split (50% EFH, 50% Partners)
      const totalAmount = program.student_price * 100; // Convert to cents
      const efhRevenue = Math.round(totalAmount * 0.5); // EFH gets paid first
      const partnerRevenue = totalAmount - efhRevenue;

      // Create payment intent - EFH receives payment first
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: totalAmount,
        currency: 'usd',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: 'https://elevateforhumanity.org/enrollment/complete',
        // Note: Partner transfer happens separately after EFH receives payment
        // application_fee_amount: partnerRevenue,
        // transfer_data: {
        //   destination: partnerAccount.id,
        // },
        metadata: {
          program_id: programId,
          partner_id: partnerId,
          student_email: studentEmail,
          student_name: studentName,
          efh_revenue: (efhRevenue / 100).toString(),
          partner_revenue: (partnerRevenue / 100).toString(),
          enrollment_type: 'partner_program',
          dual_certification: 'true',
          payment_order: 'efh_first_then_partner',
        },
      });

      // Record the transaction
      const transaction = await this.recordTransaction({
        payment_intent_id: paymentIntent.id,
        program_id: programId,
        partner_id: partnerId,
        student_email: studentEmail,
        total_amount: totalAmount / 100,
        efh_revenue: efhRevenue / 100,
        partner_revenue: partnerRevenue / 100,
        status: paymentIntent.status,
        payment_order: 'efh_first',
      });

      return {
        success: true,
        payment_intent: paymentIntent,
        transaction: transaction,
        enrollment_details: {
          program_name: program.name,
          certification: program.certification,
          duration: program.duration,
          partner_name:
            this.catalog.credentialing_partners[partnerId].partner_name,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create Stripe Checkout session with revenue split
   * EFH receives payment first, then transfers to partner
   */
  async createCheckoutSession(
    programId,
    partnerId,
    customerEmail,
    successUrl,
    cancelUrl
  ) {
    const program = this.getProgramDetails(partnerId, programId);
    const partnerData = this.catalog.credentialing_partners[partnerId];
    const partnerAccount = await this.getPartnerAccount(partnerId);

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: program.name,
              description: `${program.description} - Dual certification from ${partnerData.partner_name} and Elevate for Humanity`,
              images: [
                `https://elevateforhumanity.org/assets/certifications/${programId}.jpg`,
              ],
            },
            unit_amount: program.student_price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        program_id: programId,
        partner_id: partnerId,
        partner_account_id: partnerAccount.id,
        efh_revenue: (program.student_price * 0.5).toString(),
        partner_revenue: (program.student_price * 0.5).toString(),
        payment_order: 'efh_first_then_partner',
      },
      payment_intent_data: {
        // EFH receives payment first - partner transfer happens in webhook
        metadata: {
          enrollment_type: 'partner_program',
          dual_certification: 'true',
          partner_account_id: partnerAccount.id,
        },
      },
    });

    return session;
  }

  /**
   * Get or create partner Stripe Connect account
   */
  async getPartnerAccount(partnerId) {
    // Check cache first
    if (this.partnerAccounts.has(partnerId)) {
      return this.partnerAccounts.get(partnerId);
    }

    const partnerData = this.catalog.credentialing_partners[partnerId];
    if (!partnerData) {
      throw new Error(`Partner ${partnerId} not found in catalog`);
    }

    try {
      // Try to find existing account
      const accounts = await this.stripe.accounts.list({
        limit: 100,
      });

      let account = accounts.data.find(
        (acc) => acc.metadata && acc.metadata.partner_id === partnerId
      );

      if (!account) {
        // Create new Express account
        account = await this.stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: `partnerships+${partnerId}@elevateforhumanity.org`,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'company',
          company: {
            name: partnerData.partner_name,
          },
          metadata: {
            partner_id: partnerId,
            revenue_split: partnerData.partner_split.toString(),
            created_by: 'elevate_for_humanity',
          },
        });

          `✅ Created new Connect account for ${partnerData.partner_name}`
        );
      }

      // Cache the account
      this.partnerAccounts.set(partnerId, account);
      return account;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle successful payment webhook
   * EFH receives payment first, then transfers to partner
   */
  async handlePaymentSuccess(paymentIntent) {
    const metadata = paymentIntent.metadata;

    if (metadata.enrollment_type === 'partner_program') {
      // Step 1: EFH has already received payment

      // Step 2: Transfer 50% to partner
      if (metadata.partner_account_id) {
        const partnerAmount = Math.round(paymentIntent.amount * 0.5);
        await this.transferToPartner(
          partnerAmount,
          metadata.partner_account_id,
          paymentIntent.id
        );
      }

      // Step 3: Trigger enrollment process
      await this.triggerEnrollment({
        payment_intent_id: paymentIntent.id,
        program_id: metadata.program_id,
        partner_id: metadata.partner_id,
        student_email: metadata.student_email,
        student_name: metadata.student_name,
      });

      // Step 4: Send confirmation emails
      await this.sendEnrollmentConfirmation(metadata);

      // Step 5: Notify partner
      await this.notifyPartner(metadata);
    }
  }

  /**
   * Transfer funds to partner after EFH receives payment
   */
  async transferToPartner(amount, partnerAccountId, paymentIntentId) {
    try {
      const transfer = await this.stripe.transfers.create({
        amount: amount,
        currency: 'usd',
        destination: partnerAccountId,
        metadata: {
          payment_intent_id: paymentIntentId,
          transfer_type: 'partner_revenue_split',
          split_percentage: '50',
        },
      });

        `💸 Transferred $${amount / 100} to partner: ${partnerAccountId}`
      );
      return transfer;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Trigger enrollment in partner system
   */
  async triggerEnrollment(enrollmentData) {
    const program = this.getProgramDetails(
      enrollmentData.partner_id,
      enrollmentData.program_id
    );
    const partnerData =
      this.catalog.credentialing_partners[enrollmentData.partner_id];

    // Create enrollment record
    const enrollment = {
      id: `enroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      student_email: enrollmentData.student_email,
      student_name: enrollmentData.student_name,
      program_id: enrollmentData.program_id,
      program_name: program.name,
      partner_id: enrollmentData.partner_id,
      partner_name: partnerData.partner_name,
      certification_target: program.certification,
      duration: program.duration,
      level: program.level,
      enrolled_at: new Date().toISOString(),
      status: 'enrolled',
      payment_intent_id: enrollmentData.payment_intent_id,
      course_access_url: this.generateCourseAccessUrl(
        enrollmentData.partner_id,
        enrollmentData.program_id
      ),
      expected_completion: this.calculateCompletionDate(program.duration),
    };

    // Store enrollment (would integrate with database)

    return enrollment;
  }

  /**
   * Generate course access URL for student
   */
  generateCourseAccessUrl(partnerId, programId) {
    const baseUrls = {
      google_cloud: 'https://cloud.google.com/training',
      microsoft: 'https://learn.microsoft.com',
      comptia: 'https://www.comptia.org/training',
      ibew: 'https://www.ibew.org/training',
      milady: 'https://www.milady.com/training',
      nccer: 'https://www.nccer.org/training',
    };

    const baseUrl =
      baseUrls[partnerId] || 'https://elevateforhumanity.org/courses';
    return `${baseUrl}/${programId}?ref=elevate_for_humanity`;
  }

  /**
   * Calculate expected completion date
   */
  calculateCompletionDate(duration) {
    const weeks = parseInt(duration.split('-')[1] || duration.split(' ')[0]);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + weeks * 7);
    return completionDate.toISOString();
  }

  /**
   * Send enrollment confirmation to student
   */
  async sendEnrollmentConfirmation(metadata) {
    const program = this.getProgramDetails(
      metadata.partner_id,
      metadata.program_id
    );
    const partnerData =
      this.catalog.credentialing_partners[metadata.partner_id];

    const emailData = {
      to: metadata.student_email,
      subject: `🎓 Enrollment Confirmed: ${program.name}`,
      template: 'enrollment_confirmation',
      data: {
        student_name: metadata.student_name,
        program_name: program.name,
        partner_name: partnerData.partner_name,
        certification: program.certification,
        duration: program.duration,
        course_access_url: this.generateCourseAccessUrl(
          metadata.partner_id,
          metadata.program_id
        ),
        support_email: 'support@elevateforhumanity.org',
      },
    };

    // Would integrate with email service (SendGrid, etc.)
  }

  /**
   * Get program details from catalog
   */
  getProgramDetails(partnerId, programId) {
    const partner = this.catalog.credentialing_partners[partnerId];
    if (!partner) return null;

    return partner.programs.find((p) => p.id === programId);
  }

  /**
   * Record transaction for reporting
   */
  async recordTransaction(transactionData) {
    // Would store in database
    return transactionData;
  }

  /**
   * Generate revenue report
   */
  async generateRevenueReport(startDate, endDate) {
    // Would query database for actual transactions
    const mockReport = {
      period: `${startDate} to ${endDate}`,
      total_revenue: 0,
      elevate_revenue: 0,
      partner_revenue: 0,
      transaction_count: 0,
      partner_breakdown: {},
      top_programs: [],
    };

    return mockReport;
  }
}

module.exports = RevenueSplitSystem;

// Example usage
if (require.main === module) {
  const revenueSplit = new RevenueSplitSystem();

}
