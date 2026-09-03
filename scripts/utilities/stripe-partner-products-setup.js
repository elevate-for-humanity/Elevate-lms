/**
 * STRIPE PARTNER PROGRAMS SETUP
 * Automated product creation with 50% markup and revenue splits
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const partnerCatalog = require('./partner-programs-catalog.json');

class StripePartnerProductsManager {
  constructor() {
    this.stripe = stripe;
    this.catalog = partnerCatalog;
  }

  /**
   * Create all partner programs as Stripe products
   */
  async createAllPartnerProducts() {
    const results = {
      created: [],
      errors: [],
      total_products: 0,
      total_revenue_potential: 0,
    };

    for (const [partnerId, partnerData] of Object.entries(
      this.catalog.credentialing_partners
    )) {

      for (const program of partnerData.programs) {
        try {
          const product = await this.createPartnerProduct(
            partnerId,
            program,
            partnerData
          );
          results.created.push(product);
          results.total_revenue_potential += program.student_price;
            `✅ Created: ${program.name} - $${program.student_price}`
          );
        } catch (error) {
          results.errors.push({
            program: program.name,
            error: error.message,
          });
        }
      }
    }

    results.total_products = results.created.length;
    return results;
  }

  /**
   * Create individual Stripe product with pricing
   */
  async createPartnerProduct(partnerId, program, partnerData) {
    // Create the product
    const product = await this.stripe.products.create({
      name: program.name,
      description: program.description,
      metadata: {
        partner_id: partnerId,
        partner_name: partnerData.partner_name,
        program_id: program.id,
        partner_price: program.partner_price.toString(),
        elevate_markup: program.elevate_markup.toString(),
        partner_split: partnerData.partner_split.toString(),
        elevate_split: partnerData.elevate_split.toString(),
        certification: program.certification,
        duration: program.duration,
        level: program.level,
      },
      images: [
        `https://elevateforhumanity.org/assets/certifications/${program.id}.jpg`,
      ],
      url: `https://elevateforhumanity.org/programs/${program.id}`,
    });

    // Create the price
    const price = await this.stripe.prices.create({
      product: product.id,
      unit_amount: program.student_price * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        partner_revenue: (program.student_price * 0.5).toString(),
        elevate_revenue: (program.student_price * 0.5).toString(),
        original_partner_price: program.partner_price.toString(),
      },
    });

    return {
      product_id: product.id,
      price_id: price.id,
      program_name: program.name,
      student_price: program.student_price,
      partner_revenue: program.student_price * 0.5,
      elevate_revenue: program.student_price * 0.5,
    };
  }

  /**
   * Create Stripe Connect accounts for revenue splitting
   */
  async setupRevenueSpitting() {
    const connectAccounts = {};

    for (const [partnerId, partnerData] of Object.entries(
      this.catalog.credentialing_partners
    )) {
      try {
        // Create Express account for partner
        const account = await this.stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: `partnerships@${partnerId}.com`, // Would need real emails
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
          },
        });

        connectAccounts[partnerId] = {
          account_id: account.id,
          partner_name: partnerData.partner_name,
          onboarding_url: await this.createAccountLink(account.id),
        };

          `✅ Created Connect account for ${partnerData.partner_name}`
        );
      } catch (error) {
          `❌ Error creating account for ${partnerData.partner_name}:`,
          error.message
        );
      }
    }

    return connectAccounts;
  }

  /**
   * Create account link for partner onboarding
   */
  async createAccountLink(accountId) {
    const accountLink = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: 'https://elevateforhumanity.org/partner-onboarding/refresh',
      return_url: 'https://elevateforhumanity.org/partner-onboarding/complete',
      type: 'account_onboarding',
    });

    return accountLink.url;
  }

  /**
   * Process payment with automatic revenue split
   */
  async processPartnerProgramPayment(priceId, customerEmail, programMetadata) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url:
        'https://elevateforhumanity.org/enrollment/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://elevateforhumanity.org/programs',
      customer_email: customerEmail,
      metadata: {
        program_id: programMetadata.program_id,
        partner_id: programMetadata.partner_id,
        partner_revenue: programMetadata.partner_revenue,
        elevate_revenue: programMetadata.elevate_revenue,
      },
      payment_intent_data: {
        application_fee_amount: Math.round(
          programMetadata.partner_revenue * 100
        ), // Partner's 50%
        transfer_data: {
          destination: programMetadata.partner_connect_account_id,
        },
        metadata: {
          program_enrollment: 'true',
          dual_certification: 'true',
        },
      },
    });

    return session;
  }

  /**
   * Generate comprehensive pricing report
   */
  generatePricingReport() {
    const report = {
      total_programs: 0,
      total_revenue_potential: 0,
      partner_breakdown: {},
      pricing_tiers: {
        beginner: { count: 0, avg_price: 0, total: 0 },
        intermediate: { count: 0, avg_price: 0, total: 0 },
        advanced: { count: 0, avg_price: 0, total: 0 },
      },
    };

    for (const [partnerId, partnerData] of Object.entries(
      this.catalog.credentialing_partners
    )) {
      const partnerStats = {
        partner_name: partnerData.partner_name,
        program_count: partnerData.programs.length,
        total_revenue: 0,
        avg_price: 0,
        programs: [],
      };

      for (const program of partnerData.programs) {
        report.total_programs++;
        report.total_revenue_potential += program.student_price;
        partnerStats.total_revenue += program.student_price;

        // Track by level
        const level = program.level.toLowerCase();
        if (report.pricing_tiers[level]) {
          report.pricing_tiers[level].count++;
          report.pricing_tiers[level].total += program.student_price;
        }

        partnerStats.programs.push({
          name: program.name,
          student_price: program.student_price,
          partner_revenue: program.student_price * 0.5,
          elevate_revenue: program.student_price * 0.5,
        });
      }

      partnerStats.avg_price =
        partnerStats.total_revenue / partnerStats.program_count;
      report.partner_breakdown[partnerId] = partnerStats;
    }

    // Calculate averages for pricing tiers
    for (const tier of Object.keys(report.pricing_tiers)) {
      const tierData = report.pricing_tiers[tier];
      if (tierData.count > 0) {
        tierData.avg_price = tierData.total / tierData.count;
      }
    }

    return report;
  }
}

// Export for use in other modules
module.exports = StripePartnerProductsManager;

// CLI execution
if (require.main === module) {
  const manager = new StripePartnerProductsManager();

  async function main() {

    // Generate pricing report
    const report = manager.generatePricingReport();
      `Total Revenue Potential: $${report.total_revenue_potential.toLocaleString()}`
    );
      `Average Price per Program: $${Math.round(report.total_revenue_potential / report.total_programs)}`
    );

    for (const [partnerId, stats] of Object.entries(report.partner_breakdown)) {
        `${stats.partner_name}: ${stats.program_count} programs, $${Math.round(stats.avg_price)} avg price`
      );
    }

    for (const [tier, data] of Object.entries(report.pricing_tiers)) {
      if (data.count > 0) {
          `${tier.toUpperCase()}: ${data.count} programs, $${Math.round(data.avg_price)} avg price`
        );
      }
    }

    // Uncomment to actually create products (requires valid Stripe keys)
    // const results = await manager.createAllPartnerProducts();
  }

  main().catch(console.error);
}
