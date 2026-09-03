#!/usr/bin/env tsx
/**
 * One-off: email Jordan White — update payment + $76.41 pay link + hours warning.
 * Usage: STRIPE_SECRET_KEY=... pnpm tsx scripts/send-jordan-payment-email.ts
 */

import Stripe from 'stripe';
import { hydrateProcessEnv } from '../lib/secrets';
import { PLATFORM_DEFAULTS } from '../lib/config/platform-config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
const JORDAN_CUSTOMER = 'cus_UGFxoJKjtlNoy8';
const JORDAN_EMAIL = 'jbwhite888@icloud.com';
const ADMIN_BCC = 'elevate4humanityedu@gmail.com';

async function sendViaSendGrid(to: string, subject: string, html: string) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error('SENDGRID_API_KEY not configured');
  const replyTo = process.env.REPLY_TO_EMAIL || 'elevate4humanityedu@gmail.com';
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], bcc: [{ email: ADMIN_BCC }] }],
      from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
      reply_to: { email: replyTo.replace(/.*<(.+)>.*/, '$1').includes('@') ? replyTo.replace(/.*<(.+)>.*/, '$1') : replyTo },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  if (!res.ok) throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
}

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPR_SECRET_KEY;
  if (!stripeKey) {
    console.error('Set STRIPE_SECRET_KEY');
    process.exit(1);
  }

  await hydrateProcessEnv();
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion });

  const open = await stripe.invoices.list({ customer: JORDAN_CUSTOMER, status: 'open', limit: 1 });
  const inv = open.data[0];
  if (!inv?.hosted_invoice_url) {
    console.error('No open invoice for Jordan');
    process.exit(1);
  }

  const paymentLink = inv.hosted_invoice_url;
  const portal = await stripe.billingPortal.sessions.create({
    customer: JORDAN_CUSTOMER,
    return_url: `${SITE_URL}/apprentice`,
  });

  const subject = 'Action required: Update payment — weekly tuition $76.41 due';
  const html = `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1e293b;line-height:1.6">
  <h2 style="color:#dc2626;margin:0 0 12px">Payment required this week</h2>
  <p>Hi Jordan,</p>
  <p>We attempted to process your <strong>weekly barber apprenticeship tuition ($76.41)</strong>, but your payment was declined due to <strong>insufficient funds</strong>.</p>
  <p style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin:20px 0">
    <strong>Important:</strong> Until your payment method is updated and this week&apos;s tuition is paid,
    <strong>hours logged this week will not count</strong> toward your apprenticeship requirement.
    Your previous hours and progress remain saved.
  </p>
  <p style="margin:24px 0">
    <a href="${paymentLink}"
       style="background:#ea580c;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">
      Pay $76.41 now
    </a>
  </p>
  <p><strong>Update banking / card on file:</strong><br>
  <a href="${portal.url}">Open billing portal</a></p>
  <p>Or: <a href="${SITE_URL}/billing-required">${SITE_URL}/billing-required</a></p>
  <p>Questions? Call <a href="tel:${PLATFORM_DEFAULTS.supportPhone.replace(/\D/g, '')}">${PLATFORM_DEFAULTS.supportPhone}</a> or reply to this email.</p>
  <p>— ${PLATFORM_DEFAULTS.orgName}<br>Barber Apprenticeship Program</p>
</div>`;

  await sendViaSendGrid(JORDAN_EMAIL, subject, html);
  console.log(`Sent to', JORDAN_EMAIL);
  console.log('Pay link:', paymentLink);
  console.log('Portal:', portal.url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
