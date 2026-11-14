#!/usr/bin/env node
/**
 * Reports whether Supabase and Elevate-owned Elevate Media Storage
 * are configured. Does not call external APIs — environment check only.
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

const elevateMediaStorage =
  (has('ELEVATE_MEDIA_ENDPOINT') || has('S3_ENDPOINT')) &&
  (has('ELEVATE_MEDIA_ACCESS_KEY_ID') || has('S3_ACCESS_KEY_ID')) &&
  (has('ELEVATE_MEDIA_SECRET_ACCESS_KEY') || has('S3_SECRET_ACCESS_KEY')) &&
  (has('ELEVATE_MEDIA_BUCKET') || has('S3_BUCKET'));

const legacyR2 =
  (
    has('CLOUDFLARE_ACCOUNT_ID') &&
    has('CLOUDFLARE_R2_ACCESS_KEY_ID') &&
    has('CLOUDFLARE_R2_SECRET_ACCESS_KEY') &&
    (has('CLOUDFLARE_R2_BUCKET_NAME') || has('CLOUDFLARE_R2_BUCKET'))
  ) ||
  (has('R2_ENDPOINT') && has('R2_ACCESS_KEY') && has('R2_SECRET_KEY') && has('R2_BUCKET'));

const publicDelivery =
  has('ELEVATE_MEDIA_PUBLIC_URL') ||
  has('NEXT_PUBLIC_ELEVATE_MEDIA_URL') ||
  has('S3_PUBLIC_URL') ||
  has('CLOUDFLARE_R2_PUBLIC_URL') ||
  has('NEXT_PUBLIC_R2_URL');

const checks = [
  {
    label: 'Supabase (auth/database + course-videos fallback)',
    ok: has('NEXT_PUBLIC_SUPABASE_URL') && has('SUPABASE_SERVICE_ROLE_KEY'),
  },
  {
    label: 'Elevate Media Storage (Backblaze B2 / Wasabi / AWS / custom)',
    ok: elevateMediaStorage || legacyR2,
  },
  {
    label: 'Object-storage public delivery URL (required for direct learner video URLs)',
    ok: publicDelivery,
  },
  {
    label: 'Northflank admin idle (no local devcontainer writes)',
    ok:
      process.env.DEVSTUDIO_DEVCONTAINER_MODE === 'github-only' ||
      !process.env.DEVSTUDIO_DEVCONTAINER_MODE,
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

console.log('\nCourse video policy: large MP4s use Elevate Media Storage only when credentials and public delivery are configured; otherwise Supabase remains the safe fallback.');
process.exit(failed ? 1 : 0);
