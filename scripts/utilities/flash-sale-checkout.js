const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { generateLicense } = require('./license-generator');
const generateLicensePDF = require('./generate-certificate');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// Flash Sale Package Definitions
const FLASH_SALE_PACKAGES = {
  emergency_starter: {
    name: 'Emergency Starter Package',
    price: 299,
    originalPrice: 1299,
    features: [
      'Complete LMS Platform',
      'Payment Integration',
      '50+ PDF Workbooks',
      '1-Year License',
      'Email Support',
      'Instant Download',
    ],
    files: ['basic-lms', 'payment-system', 'workbooks'],
    licenseType: 'starter',
  },
  business_rescue: {
    name: 'Business Rescue Package',
    price: 799,
    originalPrice: 2999,
    features: [
      'Everything in Starter',
      'Government Compliance',
      'White-Label Ready',
      'Advanced Analytics',
      '24hr Setup Help',
      '30-Day Support',
      'License Dashboard',
    ],
    files: ['complete-lms', 'government-compliance', 'analytics', 'white-label'],
    licenseType: 'business',
  },
  enterprise_emergency: {
    name: 'Enterprise Emergency Package',
    price: 1999,
    originalPrice: 9999,
    features: [
      'Everything in Business',
      'WIOA Contract Templates',
      'Proposal Writing Help',
      'Same-Day Deployment',
      '90-Day White Glove',
      'Revenue Sharing Deal',
      'Unlimited Licenses',
    ],
    files: ['full-ecosystem', 'government-contracts', 'templates', 'deployment'],
    licenseType: 'enterprise',
  },
};

// Create Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { packageId, price, isFlashSale } = req.body;

    if (!FLASH_SALE_PACKAGES[packageId]) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    const package = FLASH_SALE_PACKAGES[packageId];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `🔥 FLASH SALE: ${package.name}`,
              description: `Emergency Sale - ${Math.round(((package.originalPrice - package.price) / package.originalPrice) * 100)}% OFF!`,
              images: ['https://elevateforhumanity.org/images/flash-sale-banner.png'],
            },
            unit_amount: package.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/flash-sale-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/flash-sale-store.html`,
      metadata: {
        packageId: packageId,
        isFlashSale: 'true',
        licenseType: package.licenseType,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Webhook handler for successful payments
app.post(
  '/webhook/stripe-flash-sale',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      try {
        // Get customer email and package info
        const customerEmail = session.customer_details.email;
        const packageId = session.metadata.packageId;
        const licenseType = session.metadata.licenseType;

        // Generate license
        const { licenseKey, expiresAt } = generateLicense(
          customerEmail,
          packageId,
          365, // 1 year
        );

        // Generate PDF certificate
        const certificatePath = await generateLicensePDF(
          customerEmail,
          FLASH_SALE_PACKAGES[packageId].name,
          licenseKey,
          expiresAt,
        );

        // Send email with license and download links
        await sendFlashSaleLicense(customerEmail, packageId, licenseKey, certificatePath);
      } catch (error) {}
    }

    res.json({ received: true });
  },
);

// Email delivery function
async function sendFlashSaleLicense(email, packageId, licenseKey, certificatePath) {
  const package = FLASH_SALE_PACKAGES[packageId];

  // Email template for flash sale
  const emailTemplate = `
    🔥 FLASH SALE LICENSE DELIVERED!

    Thank you for your emergency purchase of ${package.name}!

    Your License Key: ${licenseKey}

    IMMEDIATE ACCESS:
    • Download your files: https://elevateforhumanity.org/download/${licenseKey}
    • License Dashboard: https://elevateforhumanity.org/license-dashboard.html
    • Certificate: Attached PDF

    WHAT'S INCLUDED:
    ${package.features.map((f) => `✅ ${f}`).join('\n    ')}

    URGENT SUPPORT:
    Due to the emergency nature of this sale, priority support is available at:
    emergency-support@elevateforhumanity.com

    Your purchase helps during a difficult time - thank you!

    Best regards,
    Elevate Team
  `;

  // Here you would integrate with your email service

  return true;
}

// Success page data endpoint
app.get('/api/flash-sale-success/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    const packageId = session.metadata.packageId;

    res.json({
      success: true,
      package: FLASH_SALE_PACKAGES[packageId],
      customerEmail: session.customer_details.email,
      amountPaid: session.amount_total / 100,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {});

module.exports = app;
