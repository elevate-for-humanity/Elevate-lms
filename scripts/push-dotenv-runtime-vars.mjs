#!/usr/bin/env node
/**
 * Upsert non-bootstrap vars from .env.local into Supabase app_secrets.
 * Bootstrap vars stay in process.env / Northflank secret group only.
 *
 * Usage: set -a && . ./.env.local && set +a && node scripts/sync-env-to-app-secrets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = process.argv[2] || path.join(ROOT, '.env.local');

const BOOTSTRAP = new Set([
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]);

function parseEnvFile(file) {
  const rows = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!value || BOOTSTRAP.has(key)) continue;
    rows.push({
      key,
      value,
      scope: key.startsWith('NEXT_PUBLIC_') ? 'build' : 'runtime',
    });
  }
  return rows;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey || !serviceKey.startsWith('eyJ')) {
  console.error('Load .env.local first: set -a && . ./.env.local && set +a');
  process.exit(1);
}
if (!fs.existsSync(envPath)) {
  console.error(`Missing ${envPath}`);
  process.exit(1);
}

const rows = parseEnvFile(envPath);
if (rows.length === 0) {
  console.log('No keys to sync.');
  process.exit(0);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });
const batchSize = 50;
let synced = 0;
for (let i = 0; i < rows.length; i += batchSize) {
  const batch = rows.slice(i, i + batchSize);
  const { error } = await db.from('app_secrets').upsert(batch, { onConflict: 'key' });
  if (error) {
    console.error('upsert failed:', error.message);
    process.exit(1);
  }
  synced += batch.length;
}

console.log(`Synced ${synced} key(s) to app_secrets from ${path.basename(envPath)}`);
