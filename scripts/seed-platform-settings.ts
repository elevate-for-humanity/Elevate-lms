/**
 * scripts/seed-platform-settings.ts
 *
 * Seeds platform_settings from .env.local.
 * Bootstrap keys (Supabase connection) are skipped — they must stay in process.env.
 * Safe to re-run: uses upsert, existing values are NOT overwritten unless --force is passed.
 *
 * Usage:
 *   pnpm tsx scripts/seed-platform-settings.ts
 *   pnpm tsx scripts/seed-platform-settings.ts --force   # overwrite existing values
 *   pnpm tsx scripts/seed-platform-settings.ts --dry-run # print what would be written
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const BOOTSTRAP_KEYS = new Set([
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_PROJECT_REF',
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PASSWORD',
  'NODE_ENV',
]);

const SECRET_PATTERNS = [
  /key$/i,
  /secret$/i,
  /token$/i,
  /password$/i,
  /pass$/i,
  /api_key/i,
  /private/i,
  /auth/i,
  /sid$/i,
  /dsn$/i,
  /salt$/i,
  /encryption/i,
  /webhook/i,
];

function isSecret(key: string): boolean {
  return SECRET_PATTERNS.some((p) => p.test(key));
}

async function main() {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');

  // Load .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }

  const parsed = dotenv.parse(fs.readFileSync(envPath));
  const entries = Object.entries(parsed).filter(([key]) => !BOOTSTRAP_KEYS.has(key) && key.trim());

  console.log(`Found ${entries.length} non-bootstrap keys in .env.local`);

  if (dryRun) {
    console.log('\n[DRY RUN] Would upsert:');
    entries.forEach(([key, value]) => {
      const masked = isSecret(key) ? '••••••••' + value.slice(-4) : value.slice(0, 40);
      console.log(`  ${key} = ${masked}`);
    });
    return;
  }

  // Connect to Supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  // Fetch existing keys if not forcing
  let existingKeys = new Set<string>();
  if (!force) {
    const { data } = await db.from('platform_settings').select('key');
    existingKeys = new Set((data ?? []).map((r: { key: string }) => r.key));
    console.log(
      `${existingKeys.size} keys already in platform_settings (use --force to overwrite)`,
    );
  }

  const toUpsert = force ? entries : entries.filter(([key]) => !existingKeys.has(key));

  if (toUpsert.length === 0) {
    console.log('✅ Nothing to seed — all keys already present');
    return;
  }

  console.log(`Seeding ${toUpsert.length} keys...`);

  // Batch upsert in chunks of 50
  const CHUNK = 50;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < toUpsert.length; i += CHUNK) {
    const chunk = toUpsert.slice(i, i + CHUNK).map(([k, v]) => ({
      key: k,
      value: v,
      is_secret: isSecret(k),
      is_active: true,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await db.from('platform_settings').upsert(chunk, { onConflict: 'key' });

    if (error) {
      console.error(`❌ Chunk ${i / CHUNK + 1} failed:`, error.message);
      failed += chunk.length;
    } else {
      inserted += chunk.length;
      process.stdout.write(`  ${inserted}/${toUpsert.length} seeded...\r`);
    }
  }

  console.log(`\n✅ Done — ${inserted} seeded, ${failed} failed`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
