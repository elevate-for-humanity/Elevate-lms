#!/usr/bin/env node

/**
 * Environment Variables Audit Script
 * Tests required platform connections and reports optional integrations as
 * skipped when they are intentionally not configured.
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';
import OpenAI from 'openai';
import { Redis } from '@upstash/redis';

const results = {
  timestamp: new Date().toISOString(),
  services: {},
  summary: { total: 0, working: 0, failed: 0, skipped: 0 },
};

function logTest(service, status, message, details = null) {
  results.services[service] = { status, message, details, tested_at: new Date().toISOString() };
  results.summary.total++;
  if (status === 'success') results.summary.working++;
  else if (status === 'failed') results.summary.failed++;
  else results.summary.skipped++;
}

async function testSupabase() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
      logTest('Supabase', 'failed', 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return;
    }

    const supabaseAnon = createClient(url, anonKey);
    const { error: anonError } = await supabaseAnon.from('programs').select('count').limit(1);

    if (anonError) logTest('Supabase (Anon)', 'failed', anonError.message);
    else logTest('Supabase (Anon)', 'success', 'Connected successfully');

    if (!serviceKey) {
      logTest('Supabase (Service Role)', 'failed', 'SUPABASE_SERVICE_ROLE_KEY is required for server workflows');
      return;
    }

    const supabaseService = createClient(url, serviceKey);
    const { error: serviceError } = await supabaseService.from('programs').select('count').limit(1);
    if (serviceError) logTest('Supabase (Service Role)', 'failed', serviceError.message);
    else logTest('Supabase (Service Role)', 'success', 'Connected successfully');
  } catch (error) {
    logTest('Supabase', 'failed', error.message);
  }
}

async function testStripe() {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!secretKey) {
      logTest('Stripe', 'failed', 'Missing STRIPE_SECRET_KEY');
      return;
    }

    const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' });
    const account = await stripe.accounts.retrieve();

    logTest(
      'Stripe',
      'success',
      `Connected to account: ${account.business_profile?.name || account.id}`,
      {
        account_id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        publishable_key_set: Boolean(publishableKey),
      },
    );
  } catch (error) {
    logTest('Stripe', 'failed', error.message);
  }
}

async function testResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logTest('Resend', 'skipped', 'Not configured; SendGrid/SMTP may be the active email provider');
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.domains.list();
    if (error) logTest('Resend', 'failed', error.message);
    else logTest('Resend', 'success', `Connected successfully. Domains: ${data?.data?.length || 0}`);
  } catch (error) {
    logTest('Resend', 'failed', error.message);
  }
}

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logTest('OpenAI', 'skipped', 'Not configured; other configured AI providers may be active');
    return;
  }

  try {
    const openai = new OpenAI({ apiKey });
    const models = await openai.models.list();
    logTest('OpenAI', 'success', `Connected successfully. Models available: ${models.data.length}`);
  } catch (error) {
    logTest('OpenAI', 'failed', error.message);
  }
}

async function testUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    logTest(
      'Upstash Redis',
      'skipped',
      'Distributed rate limiting not configured; bounded local fallback is active',
    );
    return;
  }

  try {
    const redis = new Redis({ url, token });
    const testKey = `audit_test_${Date.now()}`;
    await redis.set(testKey, 'test', { ex: 10 });
    const value = await redis.get(testKey);
    await redis.del(testKey);

    if (value === 'test') logTest('Upstash Redis', 'success', 'Connected and tested read/write');
    else logTest('Upstash Redis', 'failed', 'Connection succeeded but read/write failed');
  } catch (error) {
    logTest('Upstash Redis', 'failed', error.message);
  }
}

async function testDatabase() {
  const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!dbUrl) {
    if (url && serviceKey) {
      logTest(
        'PostgreSQL (Direct)',
        'skipped',
        'Direct DATABASE_URL/POSTGRES_URL is not configured; Supabase API is the active database connection',
      );
    } else {
      logTest('PostgreSQL (Direct)', 'skipped', 'Direct database URL not configured');
    }
    return;
  }

  if (!url || !serviceKey) {
    logTest('PostgreSQL (Direct)', 'skipped', 'Direct URL exists; Supabase service connection is tested separately');
    return;
  }

  try {
    const supabase = createClient(url, serviceKey);
    const { count, error } = await supabase.from('programs').select('*', { count: 'exact', head: true });
    if (error) logTest('PostgreSQL', 'failed', error.message);
    else logTest('PostgreSQL', 'success', `Connected. Programs in database: ${count || 0}`);
  } catch (error) {
    logTest('PostgreSQL', 'failed', error.message);
  }
}

async function testEnvironmentVariables() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SITE_URL',
  ];

  const optional = [
    'OPENAI_API_KEY',
    'RESEND_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'REDIS_URL',
    'DATABASE_URL',
    'POSTGRES_URL',
    'AFFIRM_PUBLIC_KEY',
    'AFFIRM_PRIVATE_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);
  const optionalMissing = optional.filter((key) => !process.env[key]);

  if (missing.length === 0) {
    logTest('Environment Variables', 'success', `All ${required.length} required variables set`, {
      required_set: required.length,
      optional_set: optional.length - optionalMissing.length,
      optional_missing: optionalMissing,
    });
  } else {
    logTest('Environment Variables', 'failed', `Missing ${missing.length} required variables`, { missing });
  }
}

async function runAudit() {
  await testEnvironmentVariables();
  await testSupabase();
  await testDatabase();
  await testStripe();
  await testResend();
  await testOpenAI();
  await testUpstash();

  const fs = await import('fs');
  fs.writeFileSync('./audit-report.json', JSON.stringify(results, null, 2));

  process.exit(results.summary.failed > 0 ? 1 : 0);
}

runAudit().catch((error) => {
  console.error('\nAudit failed:', error);
  process.exit(1);
});
