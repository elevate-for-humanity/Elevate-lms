/**
 * Send BNPL Information Email to Natalia Denton
 * 
 * Usage: pnpm tsx scripts/send-bnpl-email.ts
 * 
 * This script sends an email to natasiadenton4@outlook.com with BNPL 
 * financing options for their $1,850 program enrollment.
 */

import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/sendgrid';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const RECIPIENT_EMAIL = 'natasiadenton4@outlook.com';
const RECIPIENT_NAME = 'Natalia Denton';
const PROGRAM_AMOUNT = 1850;

async function sendBnplEmail() {
  console.log('Preparing BNPL email for:', RECIPIENT_EMAIL);
  
  const subject = 'Elevate for Humanity - BNPL Financing Options for Your Program Enrollment';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BNPL Financing Options</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Elevate for Humanity</h1>
    <p style="color: #a8c8e8; margin: 10px 0 0 0; font-size: 14px;">Career-Focused Training Programs</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; line-height: 1.6;">Hello ${RECIPIENT_NAME},</p>
    
    <p style="font-size: 16px; line-height: 1.6;">
      We are excited that you are interested in enrolling in our apprenticeship program at 
      <strong>Elevate for Humanity</strong>! We're here to help you achieve your career goals 
      with flexible payment options.
    </p>
    
    <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #166534;">Your Program Investment</p>
      <p style="margin: 5px 0 0 0; font-size: 36px; font-weight: bold; color: #166534;">$${PROGRAM_AMOUNT.toLocaleString()}</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;">with flexible BNPL options</p>
    </div>
    
    <h2 style="color: #1e3a5f; font-size: 18px; margin-top: 30px;">Available Buy Now, Pay Later (BNPL) Options:</h2>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">⭐ Affirm (Recommended for $1,850)</h3>
      <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px;">
        <li>Monthly installments over 3-36 months</li>
        <li>0% APR financing available for qualified applicants</li>
        <li>Easy online application - takes just minutes</li>
        <li>Subject to credit approval</li>
      </ul>
    </div>
    
    <div style="background: #fce7f3; border-left: 4px solid #ec4899; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 10px 0; color: #9d174d; font-size: 16px;">Klarna</h3>
      <ul style="margin: 0; padding-left: 20px; color: #831843; font-size: 14px;">
        <li>Pay in 4 interest-free payments over 6 weeks</li>
        <li>Or spread payments over 6-36 months</li>
        <li>No hard credit check for pay-in-4 option</li>
      </ul>
    </div>
    
    <div style="background: #ede9fe; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <h3 style="margin: 0 0 10px 0; color: #6b21a8; font-size: 16px;">Sezzle</h3>
      <ul style="margin: 0; padding-left: 20px; color: #581c87; font-size: 14px;">
        <li>4 interest-free payments over 6 weeks</li>
        <li>Quick approval process</li>
        <li>No hard credit check</li>
      </ul>
    </div>
    
    <h2 style="color: #1e3a5f; font-size: 18px; margin-top: 30px;">How to Apply:</h2>
    
    <ol style="font-size: 14px; line-height: 1.8; color: #374151;">
      <li>Visit our enrollment page at <a href="https://www.elevateforhumanity.org/enroll" style="color: #2563eb;">elevateforhumanity.org/enroll</a></li>
      <li>Select your preferred program</li>
      <li>Choose your BNPL provider at checkout</li>
      <li>Complete the quick application (usually takes 2-3 minutes)</li>
      <li>Get approved and start your career journey!</li>
    </ol>
    
    <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        Questions? We're here to help!<br>
        <strong>Phone:</strong> (317) 660-5108<br>
        <strong>Email:</strong> info@elevateforhumanity.org
      </p>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">
      We look forward to helping you achieve your career goals and building a brighter future!
    </p>
    
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
  
  const text = `
Hello ${RECIPIENT_NAME},

We are excited that you are interested in enrolling in our apprenticeship program at Elevate for Humanity!

For your convenience, we offer Buy Now Pay Later (BNPL) financing options for your $1,850 program enrollment.

AVAILABLE BNPL OPTIONS:

Affirm (Recommended for this amount):
- Monthly installments over 3-36 months
- 0% APR financing available for qualified applicants
- Easy online application - takes just minutes
- Subject to credit approval

Klarna:
- Pay in 4 interest-free payments over 6 weeks
- Or spread payments over 6-36 months
- No hard credit check for pay-in-4 option

Sezzle:
- 4 interest-free payments over 6 weeks
- Quick approval process
- No hard credit check

HOW TO APPLY:
1. Visit https://www.elevateforhumanity.org/enroll
2. Select your preferred program
3. Choose your BNPL provider at checkout
4. Complete the quick application
5. Get approved and start your career journey!

Questions? We're here to help!
Phone: (317) 660-5108
Email: info@elevateforhumanity.org

We look forward to helping you achieve your career goals!

Warm regards,
The Elevate for Humanity Team
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
      text,
      from: fromField,
    });
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.data?.id);
    } else {
      console.error('❌ Failed to send email:', result.error);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

// Run if called directly
sendBnplEmail().catch(console.error);