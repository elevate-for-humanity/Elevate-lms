#!/usr/bin/env node
/**
 * Pre-deploy env validation. Run before the container image is deployed.
 * Exit 1 = build fails and the image is not promoted.
 */

const SERVICE = process.argv[2] || 'lms';

const REQUIRED = {
  lms: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SITE_URL',
  ],
  admin: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_ADMIN_URL',
  ],
};

const required = REQUIRED[SERVICE] ?? REQUIRED.lms;
const missing = required.filter((k) => !process.env[k]);

if (missing.length > 0) {
  console.error(`[validate-env] FAILED — missing required env vars for ${SERVICE}:`);
  missing.forEach((k) => console.error(`  - ${k}`));
  process.exit(1);
}

if (SERVICE === 'admin') {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  const admin = (process.env.NEXT_PUBLIC_ADMIN_URL || '').trim();
  if (site && admin) {
    try {
      const siteHost = new URL(site).host.toLowerCase();
      const adminHost = new URL(admin).host.toLowerCase();
      if (siteHost === adminHost) {
        console.error(
          '[validate-env] FAILED — admin build: NEXT_PUBLIC_SITE_URL must be the public LMS host (www), not the admin host. Use NEXT_PUBLIC_ADMIN_URL for admin.',
        );
        process.exit(1);
      }
      if (!adminHost.startsWith('admin.')) {
        console.warn(
          `[validate-env] WARN — NEXT_PUBLIC_ADMIN_URL host is "${adminHost}" (expected admin.* subdomain)`,
        );
      }
    } catch {
      console.error('[validate-env] FAILED — invalid NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_ADMIN_URL URL');
      process.exit(1);
    }
  }
}

console.log(`[validate-env] OK — all required env vars present for ${SERVICE}`);
