/**
 * Send CNA Program BNPL Email to Natasia Denton
 */

import { sendEmail } from '@/lib/email/sendgrid';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const RECIPIENT_EMAIL = 'natasiadenton4@outlook.com';
const RECIPIENT_NAME = 'Natasia';
const PROGRAM_AMOUNT = 1850;

async function sendCnaBnplEmail() {
  console.log('Preparing CNA BNPL email for:', RECIPIENT_EMAIL);

  const subject = 'Elevate for Humanity - CNA Program Enrollment with BNPL Financing';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CNA Program Enrollment</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">

  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Elevate for Humanity</h1>
    <p style="color: #a8c8e8; margin: 10px 0 0 0; font-size: 14px;">Career-Focused Training Programs</p>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; line-height: 1.6;">Hello ${RECIPIENT_NAME},</p>

    <p style="font-size: 16px; line-height: 1.6;">
      Thank you for your interest in our <strong>CNA (Certified Nursing Assistant) Program</strong>! 
      We're excited to help you start your healthcare career with flexible payment options.
    </p>

    <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #166534;">CNA Program Investment</p>
      <p style="margin: 5px 0 0 0; font-size: 36px; font-weight: bold; color: #166534;">$${PROGRAM_AMOUNT.toLocaleString()}</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;">with flexible BNPL options</p>
    </div>

    <h2 style="color: #1e3a5f; font-size: 18px; margin-top: 30px;">📋 Step 1: Apply for CNA Program</h2>
    
    <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 15px 0; font-size: 16px; color: #1e40af;">
        Click below to start your CNA application:
      </p>
      <a href="https://www.elevateforhumanity.org/enroll" style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">Apply Now - CNA Program</a>
    </div>

    <h2 style="color: #1e3a5f; font-size: 18px; margin-top: 30px;">💳 Step 2: Choose BNPL at Checkout</h2>
    
    <p style="font-size: 14px; line-height: 1.6; color: #374151;">
      Once enrolled, you can choose from these Buy Now, Pay Later options at checkout:
    </p>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">⭐ Affirm (Recommended)</h3>
      <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px;">
        <li>Monthly installments over 3-36 months</li>
        <li>0% APR financing available for qualified applicants</li>
        <li>Easy online application - takes just minutes</li>
      </ul>
    </div>

    <div style="background: #fce7f3; border-left: 4px solid #ec4899; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 10px 0; color: #9d174d; font-size: 16px;">Klarna</h3>
      <ul style="margin: 0; padding-left: 20px; color: #831843; font-size: 14px;">
        <li>Pay in 4 interest-free payments over 6 weeks</li>
        <li>Or spread payments over 6-36 months</li>
      </ul>
    </div>

    <div style="background: #ede9fe; border-left: 4px solid #8b5cf6; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 10px 0; color: #6b21a8; font-size: 16px;">Sezzle</h3>
      <ul style="margin: 0; padding-left: 20px; color: #581c87; font-size: 14px;">
        <li>4 interest-free payments over 6 weeks</li>
        <li>Quick approval process</li>
      </ul>
    </div>

    <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        Questions? We're here to help!<br>
        <strong>Phone:</strong> (317) 660-5108<br>
        <strong>Email:</strong> info@elevateforhumanity.org
      </p>
    </div>

    <p style="font-size: 16px; line-height: 1.6;">
      Warm regards,<br>
      <strong>The Elevate for Humanity Team</strong>
    </p>
  </div>

  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
      © ${new Date().getFullYear()} Elevate for Humanity. All rights reserved.<br>
      Indianapolis, Indiana<br>
      <a href="https://www.elevateforhumanity.org" style="color: #6b7280;">www.elevateforhumanity.org</a>
    </p>
  </div>
</body>
</html>
  `;

  try {
    const fromAddress = process.env.EMAIL_FROM || 'info@elevateforhumanity.org';
    const fromField = `${PLATFORM_DEFAULTS.orgName} <${fromAddress}>`;

    console.log(`Sending email to:', RECIPIENT_EMAIL);
    console.log('Subject:', subject);

    const result = await sendEmail({
      to: RECIPIENT_EMAIL,
      subject,
      html,
      from: fromField,
    });

    if (result.success) {
      console.log('✅ Email sent successfully!');
    } else {
      console.error('❌ Failed to send email:', result.error);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

sendCnaBnplEmail().catch(console.error);
