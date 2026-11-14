/**
 * Send Payment Reminder Emails via SendGrid
 * 
 * Usage: 
 *   npx tsx scripts/send-payment-emails.ts
 * 
 * Environment variables needed:
 *   SENDGRID_API_KEY=SG.xxx
 *   SENDGRID_FROM_EMAIL=payments@elevatelms.com
 *   SENDGRID_FROM_NAME=Elevate for Humanity
 */

import { sendEmail } from '@/lib/email/sendgrid';

interface PaymentEmail {
  to: string;
  name: string;
  amount: string;
  paymentLink: string;
  program: string;
}

const PAYMENTS: PaymentEmail[] = [
  {
    to: 'Jbwhite888@icloud.com',
    name: 'Jordan',
    amount: '$76.41',
    paymentLink: 'https://buy.stripe.com/dRmaEXbrq4QS94f4NbgIo12',
    program: 'Barber Apprenticeship',
  },
  {
    to: 'nataTaroa@gmail.com',
    name: 'Natalia',
    amount: '$151.03',
    paymentLink: 'https://buy.stripe.com/6oUaEX2UUcjk3JV4NbgIo13',
    program: 'Barber Apprenticeship',
  },
];

async function sendPaymentReminders() {
  console.log('🚀 Sending payment reminder emails...\n');

  for (const payment of PAYMENTS) {
    const subject = `Payment Reminder - ${payment.program} - ${payment.name}`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .button { display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; 
              text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Elevate for Humanity</h1>
    </div>
    <div class="content">
      <h2>Hi ${payment.name},</h2>
      <p>This is a reminder that your ${payment.program} tuition payment is due.</p>
      
      <p style="font-size: 24px; font-weight: bold; color: #4CAF50;">
        Amount Due: ${payment.amount}
      </p>
      
      <p style="text-align: center;">
        <a href="${payment.paymentLink}" class="button">Pay Now</a>
      </p>
      
      <p>Click the button above or copy this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${payment.paymentLink}</p>
      
      <p>If you have any questions, please reply to this email.</p>
      
      <p>Best regards,<br/>Elevate for Humanity</p>
    </div>
    <div class="footer">
      <p>© 2024 Elevate for Humanity. All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Hi ${payment.name},

This is a reminder that your ${payment.program} tuition payment is due.

Amount Due: ${payment.amount}

Pay Now: ${payment.paymentLink}

If you have any questions, please reply to this email.

Best regards,
Elevate for Humanity
    `;

    try {
      await sendEmail({
        to: payment.to,
        subject,
        html: htmlContent,
        text: textContent,
      });
      console.log(`✅ Email sent to ${payment.name} (${payment.to})`);
    } catch (error) {
      console.error(`❌ Failed to send to ${payment.name}:`, error);
    }
  }

  console.log('\n✨ Done!');
}

sendPaymentReminders().catch(console.error);
