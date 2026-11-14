#!/usr/bin/env tsx
/**
 * Sets a secure temporary password for each barber apprentice,
 * then triggers a Supabase password-recovery email that lands the
 * user directly on /auth/reset-password so they can choose their own.
 *
 * Usage:
 *   pnpm tsx scripts/set-barber-temp-passwords.ts
 *
 * Required env (already in container env, NOT from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ─── env (no dotenv – vars are injected at container level) ──────────────────
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://cuxzzpsyufcewtmicszk.supabase.co';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  '';

const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set. Run: export SUPABASE_SERVICE_ROLE_KEY=<key>');
  process.exit(1);
}
if (!ANON_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY not set.');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Anon client used for resetPasswordForEmail (does not need admin key)
const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false },
});

// ─── recipients ──────────────────────────────────────────────────────────────
const RECIPIENTS = [
  { name: 'Jordan White',         email: 'jbwhite888@icloud.com' },
  { name: 'Mercedes Wellington',  email: 'msanqin@gmail.com'     },
  { name: 'Natalia Roa',          email: 'natataroa@gmail.com'   },
];

// ─── helpers ─────────────────────────────────────────────────────────────────
function generateTempPassword(): string {
  // 12 chars: 8 random hex + fixed suffix to always meet complexity rules
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `El${rand}#26`;
}

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Barber Temp Password Reset ===\n');

  const summary: { name: string; email: string; tempPassword: string; resetSent: boolean }[] = [];

  for (const recipient of RECIPIENTS) {
    process.stdout.write(`Processing ${recipient.name} (${recipient.email})...\n`);

    // 1. Look up user ID via profiles table (reliable — avoids listUsers pagination limits)
    const { data: profile, error: profileErr } = await adminClient
      .from('profiles')
      .select('id, email')
      .ilike('email', recipient.email)
      .maybeSingle();

    let userId: string | null = profile?.id ?? null;

    if (profileErr || !userId) {
      // Fallback: search auth users by email filter
      const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      const found = listData?.users.find(
        (u) => u.email?.toLowerCase() === recipient.email.toLowerCase(),
      );
      userId = found?.id ?? null;
    }

    if (!userId) {
      console.error(`  ✗ User not found for ${recipient.email}`);
      continue;
    }

    // Wrap in a user-like object for the rest of the logic
    const user = { id: userId };

    // 2. Generate and set temp password
    const tempPassword = generateTempPassword();
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(user.id, {
      password: tempPassword,
    });

    if (updateErr) {
      console.error(`  ✗ Failed to set temp password: ${updateErr.message}`);
      continue;
    }
    console.log(`  ✓ Temp password set`);

    // 3. Send recovery email → redirects to /auth/reset-password
    const { error: resetErr } = await anonClient.auth.resetPasswordForEmail(recipient.email, {
      redirectTo: `${SITE_URL}/auth/reset-password`,
    });

    if (resetErr) {
      console.error(`  ✗ Recovery email failed: ${resetErr.message}`);
      summary.push({ ...recipient, tempPassword, resetSent: false });
      continue;
    }
    console.log(`  ✓ Recovery email sent → ${SITE_URL}/auth/reset-password`);

    summary.push({ ...recipient, tempPassword, resetSent: true });
  }

  // ─── print credentials for operator record ───────────────────────────────
  console.log('\n========================================================================');
  console.log(' OPERATOR RECORD — TEMPORARY CREDENTIALS (share via secure channel)');
  console.log('========================================================================\n');
  for (const s of summary) {
    console.log(`Name:            ${s.name}`);
    console.log(`Username/Email:  ${s.email}`);
    console.log(`Temp Password:   ${s.tempPassword}`);
    console.log(`Login URL:       ${SITE_URL}/login`);
    console.log(`Change Password: ${SITE_URL}/auth/reset-password  (via emailed link)`);
    console.log(`               — or after login: ${SITE_URL}/update-password`);
    console.log(`Recovery email:  ${s.resetSent ? 'SENT' : 'FAILED — resend manually'}`);
    console.log('---');
  }
  console.log('\n✓ Users can log in immediately with the temp password above.');
  console.log('  The recovery email gives them a one-click link to choose their own password.\n');

  const failed = summary.filter((s) => !s.resetSent).length;
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
