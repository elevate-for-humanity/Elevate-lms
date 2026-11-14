#!/usr/bin/env node

/**
 * Send automatic payment setup emails to barber students
 * Notifies them to add/confirm payment methods via Stripe billing portal
 * (due to recent system downtime + free week adjustments)
 */

import Stripe from 'stripe';
import { sendEmail } from '@/lib/email';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

interface Student {
  name: string;
  email: string;
  customerId: string;
}

const students: Student[] = [
  { name: 'Jordan White', email: 'jbwhite888@icloud.com', customerId: 'cus_UGFxoJKjtlNoy8' },
  {
    name: 'Mercedes Wellington',
    email: 'msanqin@gmail.com',
    customerId: 'cus_UG4BIa05facQez',
  },
  { name: 'Natalia Roa', email: 'natataroa@gmail.com', customerId: 'cus_UTVa6pmsYlWBsp' },
];

async function sendPaymentSetupEmails() {
  console.log('📧 Sending payment setup emails...\n');

  for (const student of students) {
    try {
      // Create Stripe billing portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: student.customerId,
        return_url: `${SITE_URL}/apprentice`,
      });

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e293b;">Set Up Automatic Payments</h2>
          <p>Hi ${student.name},</p>
          
          <p>We recently experienced some system downtime, and we want to make sure your barber apprenticeship payment schedule is set up smoothly.</p>
          
          <p><strong>Here's what you need to do:</strong></p>
          <ol>
            <li>Click the button below to access your Stripe payment portal</li>
            <li>Add or confirm your payment method</li>
            <li>We`ll automatically charge your card weekly according to your payment plan</li>
          </ol>
          
          <p style="margin-top: 20px;">
            <a href="${session.url}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
              Set Up Automatic Payments
            </a>
          </p>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            If you have any questions or need assistance, please contact us at ${PLATFORM_DEFAULTS.supportPhone} or reply to this email.
          </p>
          
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            This is not a payment request. Please set up your payment method in the portal above to ensure your weekly charges go through smoothly.
          </p>
          
          <p style="margin-top: 30px;">Thank you,<br/><strong>Elevate for Humanity</strong></p>
        </div>
      `;

      // Send email
      await sendEmail({
        to: student.email,
        subject: `Action Required: Set Up Your Payment Method',
        html,
        bcc: 'elevate4humanityedu@gmail.com',
      });

      console.log(`✅ ${student.name} (${student.email})`);
    } catch (err: any) {
      console.error(`❌ ${student.name}: ${err.message}`);
    }
  }

  console.log('\n✅ Payment setup emails sent!\n');
}

sendPaymentSetupEmails().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
