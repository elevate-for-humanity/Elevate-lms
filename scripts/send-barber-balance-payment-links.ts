#!/usr/bin/env tsx

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY');
  process.exit(1);
}

if (!SENDGRID_API_KEY && !RESEND_API_KEY) {
  console.error('Missing email provider key: SENDGRID_API_KEY or RESEND_API_KEY');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

const FROM_EMAIL = process.env.EMAIL_FROM || 'Elevate for Humanity <info@elevateforhumanity.org>';
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || 'elevate4humanityedu@gmail.com';

function parseFrom(value: string): { email: string; name?: string } {
  const match = value.match(/^(.+?)\s*<(.+?)>$/);
  if (!match) return { email: value };
  return { name: match[1].trim(), email: match[2].trim() };
}

async function sendEmail(to: string, subject: string, html: string) {
  if (SENDGRID_API_KEY) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }], bcc: [{ email: 'elevate4humanityedu@gmail.com' }] }],
        from: parseFrom(FROM_EMAIL),
        reply_to: parseFrom(REPLY_TO_EMAIL),
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SendGrid ${response.status}: ${body}`);
    }
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: parseFrom(FROM_EMAIL).email,
      to: [to],
      bcc: ['elevate4humanityedu@gmail.com'],
      reply_to: parseFrom(REPLY_TO_EMAIL).email,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend ${response.status}: ${body}`);
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const { data: rows, error } = await db
    .from('barber_subscriptions')
    .select('id, user_id, customer_email, stripe_customer_id, remaining_balance, weeks_remaining, payment_status')
    .or('remaining_balance.gt.0,weeks_remaining.gt.0')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed loading barber_subscriptions:', error.message);
    process.exit(1);
  }

  const subscriptions = rows ?? [];
  if (subscriptions.length === 0) {
    console.log('No barber subscriptions with an outstanding balance were found.');
    return;
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions as any[]) {
    const email = sub.customer_email;
    if (!email) {
      failed += 1;
      console.error(`Missing email for subscription ${sub.id}`);
      continue;
    }

    const firstName = email.split('@')[0];
    let paymentUrl = `${SITE_URL}/billing-required`;

    if (sub.stripe_customer_id) {
      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: `${SITE_URL}/apprentice`,
      });
      paymentUrl = session.url;
    }

    const subject = 'Action Needed: Update your payment method and keep access active';
    const html = `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;line-height:1.5">
  <h2 style="margin-bottom:8px">Hi ${firstName},</h2>
  <p style="margin-top:0">Your barber apprenticeship account currently shows an outstanding balance.</p>

  <div style="border:1px solid #fee2e2;border-radius:8px;padding:16px;margin:16px 0;background:#fff1f2">
    <p style="margin:0 0 8px"><strong>Remaining Balance:</strong> ${sub.remaining_balance ?? 'See portal'}</p>
    <p style="margin:0 0 8px"><strong>Weeks Remaining:</strong> ${sub.weeks_remaining ?? 'See portal'}</p>
    <p style="margin:0"><strong>Payment Portal:</strong> <a href="${paymentUrl}">${paymentUrl}</a></p>
  </div>

  <p>Please update your payment method and complete any past-due payment to prevent interruption.</p>
  <p>If you need help, call <a href="tel:3173143757">${PLATFORM_DEFAULTS.supportPhone}</a>.</p>
  <p>Elevate for Humanity</p>
</div>`;

    try {
      if (dryRun) {
        console.log(`[dry-run] would send payment link to ${email}`);
      } else {
        await sendEmail(email, subject, html);
        console.log(`sent payment link to ${email}`);
      }
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`failed sending to ${email}:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log(`done. sent=${sent}, failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
