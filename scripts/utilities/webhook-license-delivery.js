// 🚀 ELEVATE LICENSE DELIVERY WEBHOOK
// Deploy to Netlify Functions or any Node.js server
// Automatically delivers licenses and files after Stripe payment

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// 📧 Email configuration (use your preferred service)
const emailTransporter = nodemailer.createTransporter({
  service: 'gmail', // or 'sendgrid', 'mailgun', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📦 Product configuration with download links
const PRODUCT_CATALOG = {
  price_1DemoTemplate: {
    name: 'Landing Page Demo Template',
    price: 39,
    files: [
      'https://your-cdn.com/downloads/landing-template.zip',
      'https://your-cdn.com/downloads/setup-guide.pdf',
    ],
    license_type: 'single_use',
    description: 'Complete HTML template with sister-site navigation',
  },
  price_1Workbooks: {
    name: 'PDF Workbook Bundle',
    price: 29,
    files: ['https://your-cdn.com/downloads/workforce-workbooks.zip'],
    license_type: 'commercial',
    description: '50+ professional training PDFs',
  },
  price_1AICourseLicense: {
    name: 'AI Course Creator License',
    price: 199,
    files: [
      'https://your-cdn.com/downloads/ai-course-creator.zip',
      'https://your-cdn.com/downloads/api-documentation.pdf',
    ],
    license_type: 'annual',
    description: 'AI-powered course generation system',
  },
  price_1SiteClone: {
    name: 'Elevate Site Clone',
    price: 399,
    files: [
      'https://your-cdn.com/downloads/elevate-clone-full.zip',
      'https://your-cdn.com/downloads/deployment-guide.pdf',
    ],
    license_type: 'commercial',
    description: 'Complete source code with documentation',
  },
  price_1WhiteLabel: {
    name: 'White-Label Platform',
    price: 599,
    files: [
      'https://your-cdn.com/downloads/white-label-platform.zip',
      'https://your-cdn.com/downloads/branding-kit.zip',
      'https://your-cdn.com/downloads/customization-guide.pdf',
    ],
    license_type: 'reseller',
    description: 'Full platform with custom branding',
  },
};

// 🔐 License key generator
function generateLicenseKey() {
  const segments = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }

  return `ELV-${segments.join('-')}`;
}

// 📅 Calculate license expiry
function getLicenseExpiry(licenseType) {
  const now = new Date();

  switch (licenseType) {
    case 'annual':
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    case 'single_use':
      return new Date(now.getFullYear() + 10, now.getMonth(), now.getDate()); // 10 years
    case 'commercial':
    case 'reseller':
      return null; // Lifetime
    default:
      return null;
  }
}

// 🎯 Main webhook handler
exports.handler = async (event, context) => {
  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      endpointSecret
    );
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid signature' }),
    };
  }

  // Handle successful payment
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    try {
      await processSuccessfulPayment(session);
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Processing failed' }),
      };
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};

// 💳 Process successful payment and deliver license
async function processSuccessfulPayment(session) {
  // Get line items from the session
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  const customerEmail = session.customer_details.email;
  const customerName = session.customer_details.name || 'Valued Customer';

  // Process each purchased item
  const licenses = [];

  for (const item of lineItems.data) {
    const priceId = item.price.id;
    const product = PRODUCT_CATALOG[priceId];

    if (product) {
      const license = {
        key: generateLicenseKey(),
        product: product.name,
        price: product.price,
        files: product.files,
        licenseType: product.license_type,
        expiresAt: getLicenseExpiry(product.license_type),
        issuedAt: new Date(),
        customerEmail: customerEmail,
        customerName: customerName,
        stripeSessionId: session.id,
      };

      licenses.push(license);

      // Store license in your database (optional)
      await storeLicense(license);
    }
  }

  // Send delivery email
  if (licenses.length > 0) {
    await sendLicenseEmail(customerEmail, customerName, licenses, session);
  }
}

// 💾 Store license in database (implement with your preferred DB)
async function storeLicense(license) {
  // Example: Store in Supabase, Firebase, or your database

  // Uncomment and implement with your database:
  /*
  const { data, error } = await supabase
    .from('licenses')
    .insert({
      license_key: license.key,
      product_name: license.product,
      customer_email: license.customerEmail,
      customer_name: license.customerName,
      license_type: license.licenseType,
      expires_at: license.expiresAt,
      stripe_session_id: license.stripeSessionId,
      created_at: license.issuedAt
    });
  */
}

// 📧 Send license delivery email
async function sendLicenseEmail(email, name, licenses, session) {
  const totalAmount = session.amount_total / 100; // Convert from cents

  const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
    .content { padding: 2rem; }
    .license-box { background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
    .license-key { background: #e3f2fd; padding: 1rem; border-radius: 4px; font-family: monospace; font-size: 1.2em; font-weight: bold; text-align: center; }
    .download-btn { display: inline-block; background: #28a745; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 5px; margin: 0.5rem; }
    .footer { background: #f8f9fa; padding: 1rem; text-align: center; font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Your Elevate Platform Purchase</h1>
    <p>Thank you for your order! Your licenses are ready.</p>
  </div>

  <div class="content">
    <h2>Hello ${name}!</h2>
    <p>Your payment of <strong>$${totalAmount}</strong> has been processed successfully. Here are your license details and download links:</p>

    ${licenses
      .map(
        (license) => `
      <div class="license-box">
        <h3>📦 ${license.product}</h3>
        <p><strong>License Key:</strong></p>
        <div class="license-key">${license.key}</div>

        <p><strong>License Type:</strong> ${license.licenseType.replace('_', ' ').toUpperCase()}</p>
        ${license.expiresAt ? `<p><strong>Expires:</strong> ${license.expiresAt.toDateString()}</p>` : '<p><strong>License:</strong> Lifetime</p>'}

        <p><strong>Download Files:</strong></p>
        ${license.files
          .map((file) => {
            const fileName = file.split('/').pop();
            return `<a href="${file}" class="download-btn">📥 Download ${fileName}</a>`;
          })
          .join('')}
      </div>
    `
      )
      .join('')}

    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 1rem; border-radius: 5px; margin: 2rem 0;">
      <h4>🔐 Important License Information:</h4>
      <ul>
        <li>Keep your license keys safe - you'll need them for activation</li>
        <li>Download links are valid for 30 days</li>
        <li>For support, email: <strong>support@elevateforhumanity.com</strong></li>
        <li>Include your license key in any support requests</li>
      </ul>
    </div>

    <h3>🎯 Next Steps:</h3>
    <ol>
      <li>Download your files using the links above</li>
      <li>Follow the setup guides included in your download</li>
      <li>Use your license key when prompted during installation</li>
      <li>Join our community: <a href="https://discord.gg/elevate">Discord Support</a></li>
    </ol>
  </div>

  <div class="footer">
    <p>© 2025 Selfish Inc. DBA Rise Foundation | Licensed Use Only</p>
    <p>Need help? Reply to this email or contact support@elevateforhumanity.com</p>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `🎯 Your Elevate Platform License - Order #${session.id.slice(-8)}`,
    html: emailHTML,
  };

  try {
    await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    throw error;
  }
}

// 🔍 License validation endpoint (optional)
exports.validateLicense = async (event, context) => {
  const { licenseKey, domain } = JSON.parse(event.body);

  // Implement license validation logic
  // Check against your database, validate domain restrictions, etc.

  return {
    statusCode: 200,
    body: JSON.stringify({
      valid: true,
      product: 'Elevate Platform',
      expiresAt: null, // or actual expiry date
    }),
  };
};

// 📊 Usage tracking endpoint (optional)
exports.trackUsage = async (event, context) => {
  const { licenseKey, action, metadata } = JSON.parse(event.body);

  // Track license usage for analytics

  return {
    statusCode: 200,
    body: JSON.stringify({ tracked: true }),
  };
};
