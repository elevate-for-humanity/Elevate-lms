#!/usr/bin/env node
/**
 * Reports whether Cloudflare R2 / Supabase storage env is set for production.
 * Does not call external APIs — env check only.
 */
import { existsSync, readFileSync } from 'node:fs';

function env(name) {
  return Boolean(process.env[name]?.trim());
}

function fromEnvFiles(name) {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    const m = readFileSync(file, 'utf8').match(new RegExp(`^${name}=(.+)$`, 'm'));
    if (m?.[1]?.trim()) return true;
  }
  return false;
}

function has(name) {
  return env(name) || fromEnvFiles(name);
}

const checks = [
  {
    label: 'Supabase (required for course-videos)',
    ok:
      has('NEXT_PUBLIC_SUPABASE_URL') &&
      has('SUPABASE_SERVICE_ROLE_KEY'),
  },
  {
    label: 'Cloudflare R2 — lib/cloudflare-r2.ts (CLOUDFLARE_*)',
    ok:
      has('CLOUDFLARE_ACCOUNT_ID') &&
      has('CLOUDFLARE_R2_ACCESS_KEY_ID') &&
      has('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
  },
  {
    label: 'Cloudflare R2 — lib/storage/file-storage.ts (R2_*)',
    ok: has('R2_ACCESS_KEY') && has('R2_SECRET_KEY') && has('R2_BUCKET'),
  },
  {
    label: 'Cloudflare Stream (optional video CDN)',
    ok: has('CLOUDFLARE_ACCOUNT_ID') && has('CLOUDFLARE_STREAM_API_TOKEN'),
  },
  {
    label: 'Northflank admin idle (no local devcontainer writes)',
    ok: process.env.DEVSTUDIO_DEVCONTAINER_MODE === 'github-only' || !process.env.DEVSTUDIO_DEVCONTAINER_MODE,
    warn: true,
  },
];

let failed = false;
console.log('Media & storage configuration\n');
for (const c of checks) {
  const icon = c.ok ? '✅' : c.warn ? '⚠️' : '❌';
  console.log(`${icon} ${c.label}`);
  if (!c.ok && !c.warn) failed = true;
}

console.log('\nPolicy: docs/audits/admin-runtime-idle-and-storage-2026-06-05.md');
process.exit(failed ? 1 : 0);
