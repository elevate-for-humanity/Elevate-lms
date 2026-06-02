#!/usr/bin/env tsx
/**
 * Sync environment variables to a Northflank project secret group.
 *
 * Sources (merged, later wins):
 *   1. JSON file (--file exports/northflank-env.production.json)
 *   2. Current process.env for keys in env-keys-manifest.txt
 *   3. Static production defaults below
 *
 * Usage:
 *   pnpm tsx scripts/northflank/sync-env.ts --dry-run
 *   pnpm tsx scripts/northflank/sync-env.ts --execute
 *   pnpm tsx scripts/northflank/sync-env.ts --file exports/northflank-env.production.json --execute
 *
 * Env:
 *   NORTHFLANK_API_TOKEN, NORTHFLANK_PROJECT_ID
 *   NORTHFLANK_LMS_SERVICE_ID, NORTHFLANK_ADMIN_SERVICE_ID (optional restrict)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { nfFetch, projectApiPath, resolveProjectId, resolveLmsServiceId, resolveAdminServiceId } from './lib';

const __dir = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(__dir, 'env-keys-manifest.txt');

const STATIC_ENV: Record<string, string> = {
  NODE_ENV: 'production',
  HOSTNAME: '0.0.0.0',
  PORT: '8080',
  NEXT_TELEMETRY_DISABLED: '1',
  SUPABASE_PROJECT_REF: 'cuxzzpsyufcewtmicszk',
  PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium',
  CHROMIUM_PATH: '/usr/bin/chromium',
  NEXT_PUBLIC_SITE_URL: 'https://elevateforhumanity.org',
  NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
  NEXT_PUBLIC_LMS_URL: 'https://elevateforhumanity.org/lms',
  NEXT_PUBLIC_CANONICAL_DOMAIN: 'elevateforhumanity.org',
  NEXT_PUBLIC_ORG_NAME: 'Elevate for Humanity',
  NEXT_PUBLIC_ORG_LEGAL_NAME: 'Elevate for Humanity Technical and Career Institute',
  NEXT_PUBLIC_SUPPORT_EMAIL: 'support@elevateforhumanity.org',
  NEXT_PUBLIC_SUPPORT_PHONE: '(317) 314-3757',
  NEXT_PUBLIC_EMAIL_FROM_NAME: 'Elevate for Humanity',
  NEXT_PUBLIC_EMAIL_FROM_ADDRESS: 'noreply@elevateforhumanity.org',
  NEXT_PUBLIC_CERT_HOLDER: 'Elevate for Humanity',
  SERVICE_ROLE: 'lms',
};

function loadManifestKeys(): string[] {
  return readFileSync(MANIFEST, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function loadFromProcessEnv(keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = process.env[k];
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

function loadFromFile(path: string): Record<string, string> {
  if (!existsSync(path)) throw new Error(`File not found: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: !args.includes('--execute'),
    file: args.includes('--file') ? args[args.indexOf('--file') + 1] : undefined,
    secretId: process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env',
  };
}

async function findOrCreateSecretGroup(
  projectId: string,
  secretId: string,
  serviceIds: string[],
): Promise<string> {
  try {
    await nfFetch(projectApiPath(projectId, `/secrets/${secretId}`));
    return secretId;
  } catch {
    console.log(`Creating secret group: ${secretId}`);
  }

  const restrictions =
    serviceIds.length > 0
      ? {
          restricted: true,
          nfObjects: serviceIds.map((id) => ({ id, type: 'service' as const })),
          tagMatchCondition: 'or' as const,
        }
      : { restricted: false };

  await nfFetch(projectApiPath(projectId, '/secrets'), {
    method: 'POST',
    body: JSON.stringify({
      name: secretId,
      description: 'Elevate production env (migrated from AWS SSM / ECS)',
      priority: 10,
      type: 'secret',
      secretType: 'environment',
      restrictions,
      secrets: { variables: {} },
    }),
  });
  return secretId;
}

async function main() {
  const { dryRun, file, secretId } = parseArgs();
  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID (run: pnpm tsx scripts/northflank/audit.ts)');
    process.exit(1);
  }

  const keys = loadManifestKeys();
  let variables: Record<string, string> = { ...STATIC_ENV };

  if (file) {
    variables = { ...variables, ...loadFromFile(file) };
  }
  variables = { ...variables, ...loadFromProcessEnv(keys) };

  // Drop AWS-only bootstrap vars not needed on Northflank runtime
  delete variables.AWS_ACCESS_KEY_ID;
  delete variables.AWS_SECRET_ACCESS_KEY;
  delete variables.AWS_SESSION_TOKEN;

  const missing = keys.filter((k) => !variables[k] && k.startsWith('NEXT_PUBLIC_'));
  const missingCritical = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'STRIPE_SECRET_KEY',
    'SENDGRID_API_KEY',
  ].filter((k) => !variables[k]);

  console.log(dryRun ? '=== DRY RUN ===' : '=== EXECUTE ===');
  console.log(`Project: ${projectId}`);
  console.log(`Variables to sync: ${Object.keys(variables).length}`);
  if (missingCritical.length) {
    console.warn('\nMissing CRITICAL keys (add to Cursor secrets or --file):');
    missingCritical.forEach((k) => console.warn(`  - ${k}`));
  }
  if (missing.length) {
    console.warn(`\nMissing ${missing.length} NEXT_PUBLIC_* keys from manifest (optional for some features).`);
  }

  if (dryRun) {
    console.log('\nSample keys (names only):', Object.keys(variables).sort().slice(0, 20).join(', '), '...');
    process.exit(missingCritical.length ? 1 : 0);
  }

  const lmsId = resolveLmsServiceId();
  const adminId = resolveAdminServiceId() || 'elevate-admin';
  const serviceIds = [lmsId, adminId].filter(Boolean) as string[];

  const groupId = await findOrCreateSecretGroup(projectId, secretId, serviceIds);

  const restrictions =
    serviceIds.length > 0
      ? {
          restricted: true,
          nfObjects: serviceIds.map((id) => ({ id, type: 'service' as const })),
          tagMatchCondition: 'or' as const,
        }
      : { restricted: false };

  await nfFetch(projectApiPath(projectId, `/secrets/${groupId}`), {
    method: 'POST',
    body: JSON.stringify({
      name: groupId,
      description: 'Elevate production env (synced from AWS/Cursor)',
      priority: 10,
      type: 'secret',
      secretType: 'environment',
      restrictions,
      secrets: { variables },
    }),
  });

  console.log(`\nUpdated secret group "${groupId}" with ${Object.keys(variables).length} variables.`);
  console.log('Redeploy LMS and Admin services in Northflank to pick up changes.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
