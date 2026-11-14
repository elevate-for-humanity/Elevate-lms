// 🚀 ENHANCED ELEVATE WEBHOOK - Production Ready
// Handles payments, sends emails, stores licenses, and tracks analytics

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// 📧 Email transporter setup
const emailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📦 Product catalog with download links and license types
const PRODUCT_CATALOG = {
  price_1DemoTemplate: {
    name: 'Landing Page Demo Template',
    price: 39,
    files: [
      'https://cdn.elevateforhumanity.com/downloads/landing-template.zip',
      'https://cdn.elevateforhumanity.com/downloads/setup-guide.pdf',
    ],
    license_type: 'single_use',
    description: 'Complete HTML template with sister-site navigation',
  },
  price_1Workbooks: {
    name: 'PDF Workbook Bundle',
    price: 29,
    files: [
      'https://cdn.elevateforhumanity.com/downloads/workforce-workbooks.zip',
    ],
    license_type: 'commercial',
    description: '50+ professional training PDFs',
  },
  price_1AICourseLicense: {
    name: 'AI Course Creator License',
    price: 199,
    files: [
      'https://cdn.elevateforhumanity.com/downloads/ai-course-creator.zip',
      'https://cdn.elevateforhumanity.com/downloads/api-documentation.pdf',
    ],
    license_type: 'annual',
    description: 'AI-powered course generation system',
  },
  price_1SiteClone: {
    name: 'Elevate Site Clone',
    price: 399,
    files: [
      'https://cdn.elevateforhumanity.com/downloads/elevate-clone-full.zip',
      'https://cdn.elevateforhumanity.com/downloads/deployment-guide.pdf',
    ],
    license_type: 'commercial',
    description: 'Complete source code with documentation',
  },
  price_1WhiteLabel: {
    name: 'White-Label Platform',
    price: 599,
    files: [
      'https://cdn.elevateforhumanity.com/downloads/white-label-platform.zip',
      'https://cdn.elevateforhumanity.com/downloads/branding-kit.zip',
    ],
    license_type: 'reseller',
    description: 'Full platform with custom branding',
  },
  price_1Enterprise: {
    name: 'Enterprise License System',
    price: 1299,
    files: [
      'https://cdn.elevateforhumanity.com/downloads/enterprise-platform.zip',
      'https://cdn.elevateforhumanity.com/downloads/license-system.zip',
      'https://cdn.elevateforhumanity.com/downloads/docker-config.zip',
    ],
    license_type: 'enterprise',
    description: 'Advanced features with enterprise license protection',
  },
};

// 🔐 Enhanced license key generator
function generateLicenseKey(productId, customerEmail) {
  const timestamp = Date.now().toString(36);
  const hash = crypto
    .createHash('md5')
    .update(customerEmail + productId)
    .digest('hex')
    .substring(0, 8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `ELV-${timestamp}-${hash.toUpperCase()}-${random}`;
}

// 📅 Calculate license expiry based on type
function getLicenseExpiry(licenseType) {
  const now = new Date();

  switch (licenseType) {
    case 'annual':
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    case 'enterprise':
      return new Date(now.getFullYear() + 3, now.getMonth(), now.getDate());
    case 'single_use':
      return new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
    case 'commercial':
    case 'reseller':
      return null; // Lifetime
    default:
      return null;
  }
}

// 💾 Store license in JSON database (upgrade to real DB later)
async function storeLicense(license) {
  try {
    const licensesDir = './licenses';
    await fs.mkdir(licensesDir, { recursive: true });

    const licenseFile = path.join(licensesDir, `${license.key}.json`);
    await fs.writeFile(licenseFile, JSON.stringify(license, null, 2));

    // Also append to master log
    const logEntry = `${new Date().toISOString()},${license.key},${license.customerEmail},${license.productName},${license.price}\n`;
    await fs.appendFile('./licenses/master-log.csv', logEntry);

  } catch (error) {
  }
}

// 📊 Track analytics event
async function trackAnalytics(event, data) {
  try {
    const analyticsEntry = {
      timestamp: new Date().toISOString(),
      event: event,
      data: data,
    };

    await fs.appendFile(
      './analytics/events.jsonl',
      JSON.stringify(analyticsEntry) + '\n'
    );
  } catch (error) {
  }
}

// 📧 Send license delivery email
async function sendLicenseEmail(
  customerEmail,
  customerName,
  licenses,
  session
) {
  const totalAmount = session.amount_total / 100;

  const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 2rem; background: #f9f9f9; }
    .license-box { background: white; border: 2px solid #e9ecef; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
    .license-key { background: #e3f2fd; padding: 1rem; border-radius: 4px; font-family: monospace; font-size: 1.1em; font-weight: bold; text-align: center; margin: 1rem 0; }
    .download-btn { display: inline-block; background: #28a745; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 5px; margin: 0.5rem 0.5rem 0.5rem 0; }
    .footer { background: #333; color: white; padding: 1rem; text-align: center; font-size: 0.9em; border-radius: 0 0 8px 8px; }
    .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 1rem; border-radius: 5px; margin: 1rem 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Your Elevate Platform Purchase</h1>
    <p>Thank you for your order! Your licenses are ready for download.</p>
  </div>

  <div class="content">
    <h2>Hello ${customerName}!</h2>
    <p>Your payment of <strong>$${totalAmount}</strong> has been processed successfully. Here are your license details and download links:</p>

    ${licenses
      .map(
        (license) => `
      <div class="license-box">
        <h3>📦 ${license.productName}</h3>
        <div class="license-key">${license.key}</div>

        <p><strong>License Type:</strong> ${license.licenseType.replace('_', ' ').toUpperCase()}</p>
        ${license.expiresAt ? `<p><strong>Expires:</strong> ${license.expiresAt.toDateString()}</p>` : '<p><strong>License:</strong> Lifetime</p>'}

        <p><strong>Download Files:</strong></p>
        <div>
          ${license.files
            .map((file) => {
              const fileName = file.split('/').pop();
              return `<a href="${file}?license=${license.key}" class="download-btn">📥 ${fileName}</a>`;
            })
            .join('')}
        </div>
      </div>
    `
      )
      .join('')}

    <div class="important">
      <h4>🔐 Important License Information:</h4>
      <ul>
        <li><strong>Keep your license keys safe</strong> - you'll need them for activation</li>
        <li><strong>Download links are valid for 30 days</strong> from purchase date</li>
        <li><strong>One license per purchase</strong> - do not share license keys</li>
        <li><strong>Support:</strong> email support@elevateforhumanity.com with your license key</li>
      </ul>
    </div>

    <h3>🎯 Next Steps:</h3>
    <ol>
      <li>Download your files using the links above</li>
      <li>Follow the setup guides included in your download</li>
      <li>Use your license key when prompted during installation</li>
      <li>Join our community: <a href="https://discord.gg/elevate">Discord Support</a></li>
    </ol>

    <p>Questions? Reply to this email or contact <strong>support@elevateforhumanity.com</strong></p>
  </div>

  <div class="footer">
    <p>© 2025 Selfish Inc. DBA Rise Foundation | Licensed Use Only</p>
    <p>Order ID: ${session.id} | Need help? support@elevateforhumanity.com</p>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"Elevate Platform" <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: `🎯 Your Elevate Platform License - Order #${session.id.slice(-8)}`,
    html: emailHTML,
    attachments: [
      {
        filename: 'license-terms.pdf',
        path: './assets/license-terms.pdf', // Add your license terms PDF
      },
    ],
  };

  try {
    await emailTransporter.sendMail(mailOptions);

    // Track email delivery
    await trackAnalytics('email_sent', {
      customerEmail,
      licenseCount: licenses.length,
      totalAmount,
    });
  } catch (error) {
    throw error;
  }
}

// 🎯 Main webhook handler
app.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      try {

        // Get line items from the session
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id
        );

        const customerEmail = session.customer_details.email;
        const customerName = session.customer_details.name || 'Valued Customer';

        // Process each purchased item
        const licenses = [];

        for (const item of lineItems.data) {
          const priceId = item.price.id;
          const product = PRODUCT_CATALOG[priceId];

          if (product) {
            const licenseKey = generateLicenseKey(priceId, customerEmail);

            const license = {
              key: licenseKey,
              productId: priceId,
              productName: product.name,
              price: product.price,
              files: product.files,
              licenseType: product.license_type,
              expiresAt: getLicenseExpiry(product.license_type),
              issuedAt: new Date(),
              customerEmail: customerEmail,
              customerName: customerName,
              stripeSessionId: session.id,
              status: 'active',
            };

            licenses.push(license);

            // Store license
            await storeLicense(license);

            // Track purchase analytics
            await trackAnalytics('license_issued', {
              licenseKey,
              productId: priceId,
              productName: product.name,
              customerEmail,
              price: product.price,
            });
          }
        }

        // Send delivery email
        if (licenses.length > 0) {
          await sendLicenseEmail(
            customerEmail,
            customerName,
            licenses,
            session
          );

          // Track successful delivery
          await trackAnalytics('delivery_completed', {
            sessionId: session.id,
            customerEmail,
            licenseCount: licenses.length,
            totalAmount: session.amount_total / 100,
          });
        }

      } catch (error) {

        // Track failed delivery for manual follow-up
        await trackAnalytics('delivery_failed', {
          sessionId: session.id,
          error: error.message,
          customerEmail: session.customer_details?.email,
        });

        return res.status(500).json({ error: 'Processing failed' });
      }
    }

    res.status(200).json({ received: true });
  }
);

// 🔍 License validation endpoint
app.get('/validate/:licenseKey', async (req, res) => {
  try {
    const { licenseKey } = req.params;
    const licenseFile = `./licenses/${licenseKey}.json`;

    const licenseData = await fs.readFile(licenseFile, 'utf8');
    const license = JSON.parse(licenseData);

    // Check if license is still valid
    const isValid =
      license.status === 'active' &&
      (!license.expiresAt || new Date(license.expiresAt) > new Date());

    // Track validation attempt
    await trackAnalytics('license_validated', {
      licenseKey,
      isValid,
      productId: license.productId,
    });

    res.json({
      valid: isValid,
      product: license.productName,
      licenseType: license.licenseType,
      expiresAt: license.expiresAt,
      issuedAt: license.issuedAt,
    });
  } catch (error) {
    res.status(404).json({ valid: false, error: 'License not found' });
  }
});

// 📊 Analytics dashboard endpoint
app.get('/analytics', async (req, res) => {
  try {
    const logData = await fs.readFile('./licenses/master-log.csv', 'utf8');
    const lines = logData.trim().split('\n');

    const stats = {
      totalSales: lines.length,
      totalRevenue: 0,
      productBreakdown: {},
      recentSales: [],
    };

    lines.forEach((line) => {
      const [timestamp, licenseKey, email, product, price] = line.split(',');
      const priceNum = parseFloat(price);

      stats.totalRevenue += priceNum;
      stats.productBreakdown[product] =
        (stats.productBreakdown[product] || 0) + 1;

      if (stats.recentSales.length < 10) {
        stats.recentSales.push({ timestamp, product, price: priceNum, email });
      }
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Analytics unavailable' });
  }
});

// 🏥 Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 🚀 Start server
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
    `🔍 License validation: http://localhost:${PORT}/validate/LICENSE-KEY`
  );
});

// 📁 Create required directories on startup
async function initializeDirectories() {
  await fs.mkdir('./licenses', { recursive: true });
  await fs.mkdir('./analytics', { recursive: true });
  await fs.mkdir('./assets', { recursive: true });

  // Create CSV header if doesn't exist
  try {
    await fs.access('./licenses/master-log.csv');
  } catch {
    await fs.writeFile(
      './licenses/master-log.csv',
      'timestamp,license_key,email,product,price\n'
    );
  }
}

initializeDirectories();
