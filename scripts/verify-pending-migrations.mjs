#!/usr/bin/env node
/**
 * Verify whether the five "pending" production migrations are already live.
 * Run BEFORE telling anyone to paste SQL in the Dashboard.
 *
 * Usage:
 *   node scripts/verify-pending-migrations.mjs
 *
 * Requires one of:
 *   SUPABASE_MANAGEMENT_API_KEY + SUPABASE_PROJECT_REF
 *   SUPABASE_DB_URL or SUPABASE_DB_PASSWORD + SUPABASE_PROJECT_REF
 */

import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: join(root, '.env.local') });

const CHECKS = [
  {
    id: '20260702000009',
    label: 'two_factor_auth normalized (is_enabled dropped)',
    sql: `SELECT NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'two_factor_auth' AND column_name = 'is_enabled'
    ) AS ok`,
  },
  {
    id: '20260702000010',
    label: 'onboarding_progress_user_step_unique',
    sql: `SELECT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'onboarding_progress_user_step_unique'
    ) AS ok`,
  },
  {
    id: '20260702000011',
    label: 'storage buckets (documents, course-videos, apprentice-uploads)',
    sql: `SELECT (
      SELECT count(*) FROM storage.buckets
      WHERE id IN ('documents','course-videos','apprentice-uploads')
    ) >= 3 AS ok`,
  },
  {
    id: '20260702000012',
    label: 'program_external_courses.elevate_fee_cents',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'program_external_courses'
        AND column_name = 'elevate_fee_cents'
    ) AS ok`,
  },
  {
    id: '20260702000015',
    label: 'user_app_subscriptions.app_slug (store trials)',
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_app_subscriptions'
        AND column_name = 'app_slug'
    ) AS ok`,
  },
];

async function runViaMgmtApi(sql) {
  const key = process.env.SUPABASE_MANAGEMENT_API_KEY;
  const ref = process.env.SUPABASE_PROJECT_REF;
  if (!key || !ref) return null;

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
    signal: AbortSignal.timeout(20000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `HTTP ${res.status}`);
  return body;
}

async function runViaPg(sql) {
  const { default: pg } = await import('pg');
  let connStr = process.env.SUPABASE_DB_URL;
  if (!connStr) {
    const password = process.env.SUPABASE_DB_PASSWORD;
    const ref = process.env.SUPABASE_PROJECT_REF;
    if (password && ref) {
      connStr = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
    }
  }
  if (!connStr) return null;

  const client = new pg.Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const { rows } = await client.query(sql);
    return rows;
  } finally {
    await client.end();
  }
}

async function query(sql) {
  const mgmt = await runViaMgmtApi(sql).catch((e) => {
    throw new Error(`Management API: ${e.message}`);
  });
  if (mgmt !== null) return mgmt;

  const pgRows = await runViaPg(sql);
  if (pgRows !== null) return pgRows;

  console.error('❌ Cannot verify live DB — set SUPABASE_MANAGEMENT_API_KEY or SUPABASE_DB_PASSWORD.');
  console.error('   Without credentials, assume migrations may already be applied (check Dashboard).');
  process.exit(2);
}

async function main() {
  console.log('Pending migration verification (live Supabase)\n');
  let allOk = true;
  let needRun = [];

  for (const check of CHECKS) {
    const rows = await query(check.sql);
    const ok = Boolean(rows?.[0]?.ok);
    const icon = ok ? '✅' : '❌';
    console.log(`${icon} ${check.id} — ${check.label}`);
    if (!ok) {
      allOk = false;
      needRun.push(check.id);
    }
  }

  console.log('');
  if (allOk) {
    console.log('✅ All five checks passed — do NOT re-run migration SQL (already live).');
    process.exit(0);
  }

  console.log('⚠️  Missing:', needRun.join(', '));
  console.log('   Apply only the matching files under supabase/migrations/ in Supabase SQL Editor.');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
