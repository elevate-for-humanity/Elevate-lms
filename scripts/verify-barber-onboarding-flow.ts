#!/usr/bin/env tsx

import { config } from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required env vars for Supabase verification');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
  : null;

const students = [
  { name: 'Jordan White', email: 'jbwhite888@icloud.com' },
  { name: 'Mercedes Wellington', email: 'msanqin@gmail.com' },
  { name: 'Natalia Roa', email: 'natataroa@gmail.com' },
];

function makeTempPassword(): string {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `El${rand}#26`;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`listUsers failed: ${error.message}`);
    }

    const users = data?.users ?? [];
    const found = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (found?.id) return found.id;

    if (users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function verifyOne(student: { name: string; email: string }) {
  const userId = await findUserIdByEmail(student.email);
  if (!userId) {
    return {
      email: student.email,
      ok: false,
      steps: ['user_lookup: FAIL (no auth user found)'],
    };
  }

  const steps: string[] = [];
  const tempPassword = makeTempPassword();

  const { error: setPasswordError } = await admin.auth.admin.updateUserById(userId, {
    password: tempPassword,
  });
  if (setPasswordError) {
    return {
      email: student.email,
      ok: false,
      steps: [`set_temp_password: FAIL (${setPasswordError.message})`],
    };
  }
  steps.push('set_temp_password: PASS');

  const { error: signInError } = await publicClient.auth.signInWithPassword({
    email: student.email,
    password: tempPassword,
  });
  if (signInError) {
    steps.push(`sign_in_with_temp_password: FAIL (${signInError.message})`);
  } else {
    steps.push('sign_in_with_temp_password: PASS');
    await publicClient.auth.signOut();
  }

  const { data: recoveryData, error: recoveryError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: student.email,
    options: { redirectTo: `${SITE_URL}/auth/reset-password` },
  });

  if (recoveryError || !recoveryData?.properties?.action_link) {
    steps.push(`generate_recovery_link: FAIL (${recoveryError?.message || 'no link returned'})`);
  } else {
    steps.push('generate_recovery_link: PASS');
  }

  const { data: subRows, error: subError } = await admin
    .from('barber_subscriptions')
    .select('stripe_customer_id')
    .ilike('customer_email', student.email)
    .order('created_at', { ascending: false })
    .limit(1);

  if (subError) {
    steps.push(`subscription_lookup: FAIL (${subError.message})`);
  } else {
    const stripeCustomerId = subRows?.[0]?.stripe_customer_id || null;
    if (!stripe) {
      steps.push('stripe_portal_link: SKIP (missing STRIPE_SECRET_KEY)');
    } else if (!stripeCustomerId) {
      steps.push('stripe_portal_link: FAIL (no stripe_customer_id on latest subscription)');
    } else {
      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: stripeCustomerId,
          return_url: `${SITE_URL}/apprentice`,
        });

        if (session.url && session.url.startsWith('https://billing.stripe.com/')) {
          steps.push('stripe_portal_link: PASS');
        } else {
          steps.push('stripe_portal_link: FAIL (unexpected URL format)');
        }
      } catch (err) {
        steps.push(`stripe_portal_link: FAIL (${err instanceof Error ? err.message : String(err)})`);
      }
    }
  }

  const ok = steps.every((s) => s.includes(': PASS') || s.includes(': SKIP'));
  return {
    email: student.email,
    ok,
    tempPassword,
    steps,
  };
}

async function main() {
  console.log('Verifying onboarding flow for barber students (no emails sent)...\n');

  let passCount = 0;
  const results = [];

  for (const student of students) {
    const result = await verifyOne(student);
    results.push(result);
    if (result.ok) passCount += 1;
  }

  for (const result of results) {
    console.log(`Student: ${result.email}`);
    for (const step of result.steps) {
      console.log(`  - ${step}`);
    }

    if ('tempPassword' in result && result.tempPassword) {
      console.log(`  - temp_password_used_for_test: ${result.tempPassword}`);
    }

    console.log(`  => overall: ${result.ok ? 'PASS' : 'FAIL'}\n`);
  }

  console.log(`Summary: ${passCount}/${students.length} students fully verified`);

  if (passCount !== students.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
