import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
/**
 * Test Email Delivery
 *
 * Sends a test email to verify Resend configuration
 * Run with: npx tsx scripts/test-email.ts your@email.com
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL =
  process.env.EMAIL_FROM || 'Elevate for Humanity <noreply@elevateforhumanity.org>';

async function sendTestEmail(to: string) {
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured');
    process.exit(1);
  }

  console.log('Sending test email...');
  console.log(`From: ${FROM_EMAIL}`);
  console.log(`To: ${to}`);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject: 'Elevate for Humanity - Email Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e40af;">Email Configuration Test</h1>
            <p>This is a test email from Elevate for Humanity.</p>
            <p>If you received this, email delivery is working correctly.</p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 14px;">
              Sent at: ${new Date().toISOString()}
            </p>
          </div>
        `,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Email sent successfully');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Email failed');
      console.error('Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: npx tsx scripts/test-email.ts your@email.com');
  process.exit(1);
}

sendTestEmail(email);
