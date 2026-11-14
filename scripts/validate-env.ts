#!/usr/bin/env tsx
/**
 * Environment validation — fails hard on missing critical vars.
 *
 * Treats empty string as missing (VAR= is not configured).
 * Exits non-zero if any critical var is absent or empty.
 */

import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');

const CRITICAL = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
];

const RECOMMENDED = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'OPENAI_API_KEY',
  'BARBER_PROGRAM_ID',
];

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const result: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    result[t.slice(0, eq).trim()] = t
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return result;
}

function isSet(val: string | undefined): boolean {
  return (
    typeof val === 'string' &&
    val.length > 0 &&
    !val.includes('[password]') &&
    !val.includes('[project-ref]')
  );
}

const fileVars = parseEnvFile(envPath);
const env = (k: string) => fileVars[k] ?? process.env[k];

const missing: string[] = [];
const empty: string[] = [];
const ok: string[] = [];

for (const k of CRITICAL) {
  const v = env(k);
  if (v === undefined) missing.push(k);
  else if (!isSet(v)) empty.push(k);
  else ok.push(k);
}

const warn = RECOMMENDED.filter((k) => !isSet(env(k)));

console.log('\n── Environment validation ──────────────────────────────────\n');
ok.forEach((k) => console.log(`  ✅  ${k}`));
empty.forEach((k) => console.log(`  ❌  ${k}  (empty — placeholder value?)`));
missing.forEach((k) => console.log(`  ❌  ${k}  (not set)`));
if (warn.length) {
  console.log('\n  Recommended (degraded if absent):');
  warn.forEach((k) => console.log(`  ⚠️   ${k}`));
}

const failed = missing.length + empty.length;
console.log('');
if (failed > 0) {
  console.log(`❌  FAILED — ${failed} critical variable(s) missing or empty.`);
  console.log('   Add to .env.local. See .env.example for descriptions.');
  console.log('   Gitpod: ensure secret chunks are configured.\n');
  process.exit(1);
} else {
  console.log('✅  All critical variables present.\n');
  process.exit(0);
}
