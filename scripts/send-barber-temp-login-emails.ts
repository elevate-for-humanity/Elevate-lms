#!/usr/bin/env tsx

import { config } from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || (!SENDGRID_API_KEY && !RESEND_API_KEY)) {
  console.error(
    'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and one of SENDGRID_API_KEY or RESEND_API_KEY',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type Recipient = {
  name: string;
  email: string;
};

const recipients: Recipient[] = [
  { name: 'Jordan White', email: 'jbwhite888@icloud.com' },
  { name: 'Mercedes Wellington', email: 'msanqin@gmail.com' },
  { name: 'Natalia Roa', email: 'natataroa@gmail.com' },
];

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
        personalizations: [
          {
            to: [{ email: to }],
            bcc: [{ email: 'elevate4humanityedu@gmail.com' }],
          },
        ],
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

  // Fallback provider for environments configured with Resend only.
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
  let sent = 0;
  let failed = 0;

  const generateTempPassword = () => {
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `El${rand}#26`;
  };

  for (const recipient of recipients) {
    try {
      // Resolve user ID by profile email (with auth list fallback)
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', recipient.email)
        .maybeSingle();

      let userId: string | null = profile?.id ?? null;
      if (profileErr || !userId) {
        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const found = listData?.users.find(
          (user) => user.email?.toLowerCase() === recipient.email.toLowerCase(),
        );
        userId = found?.id ?? null;
      }

      if (!userId) {
        throw new Error('Auth user not found for email');
      }

      const tempPassword = generateTempPassword();

      if (!dryRun) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
          password: tempPassword,
        });
        if (passwordError) {
          throw new Error(`Failed to set temp password: ${passwordError.message}`);
        }
      }

      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: recipient.email,
        options: { redirectTo: `${SITE_URL}/auth/reset-password` },
      });

      if (error || !data?.properties?.action_link) {
        throw new Error(error?.message || 'No recovery link generated');
      }

      const resetLink = data.properties.action_link;
      const subject = 'Temporary Login Access - Elevate Barber Program';
      const loginUrl = `${SITE_URL}/login`;
      const updatePasswordUrl = `${SITE_URL}/update-password`;
      const html = `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;line-height:1.5">
  <h2 style="margin-bottom:8px">Hi ${recipient.name.split(' ')[0]},</h2>
  <p style="margin-top:0">Your temporary login details are ready.</p>

  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;background:#f8fafc">
    <p style="margin:0 0 8px"><strong>Username:</strong> ${recipient.email}</p>
    <p style="margin:0 0 8px"><strong>Temporary Password:</strong> ${tempPassword}</p>
    <p style="margin:0"><strong>Login:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
  </div>

  <div style="border:1px solid #dbeafe;border-radius:8px;padding:16px;margin:16px 0;background:#eff6ff">
    <p style="margin:0 0 8px"><strong>Recommended:</strong> Use this one-time secure link to set your own password now:</p>
    <p style="margin:0 0 8px"><a href="${resetLink}">${resetLink}</a></p>
    <p style="margin:0;font-size:13px;color:#334155">If the one-time link expires, sign in with your temporary password first, then update it at <a href="${updatePasswordUrl}">${updatePasswordUrl}</a>.</p>
  </div>

  <p>This ensures you have two working paths and won&apos;t get locked out.</p>
  <p>If you need help, call <a href="tel:3173143757">${PLATFORM_DEFAULTS.supportPhone}</a>.</p>
  <p>Elevate for Humanity</p>
</div>`;

      if (dryRun) {
        console.log(`[dry-run] would set temp password + send login email to ${recipient.email}`);
        sent += 1;
        continue;
      }

      await sendEmail(recipient.email, subject, html);
      sent += 1;
      console.log(`sent login email to ${recipient.email} (temp password set)`);
    } catch (err) {
      failed += 1;
      console.error(`failed for ${recipient.email}:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log(`done. sent=${sent}, failed=${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
