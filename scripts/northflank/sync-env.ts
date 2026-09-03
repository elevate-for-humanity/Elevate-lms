#!/usr/bin/env tsx
/**
 * Sync shared production secrets/config to the main Northflank web project.
 *
 * Marketing, LMS, Admin, and Store live in the main web project. The standalone
 * GPU worker lives in a separate Northflank project and MUST NOT be added to
 * this project's service restrictions. GPU client wiring for Admin is managed
 * separately by provision-gpu-worker.ts.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { nfFetch, projectApiPath, resolveProjectId, resolveLmsServiceId, resolveAdminServiceId } from './lib';
import { dedupeSecretVariables } from './canonical-env.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(__dir, 'env-keys-manifest.txt');

const STATIC_ENV: Record<string, string> = {
  SUPABASE_PROJECT_REF: 'cuxzzpsyufcewtmicszk',
  NEXT_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
  NEXT_PUBLIC_CANONICAL_DOMAIN: 'www.elevateforhumanity.org',
  NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
  NEXT_PUBLIC_APP_URL: 'https://app.elevateforhumanity.org',
  NEXT_PUBLIC_LMS_URL: 'https://app.elevateforhumanity.org',
  NEXT_PUBLIC_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
  NEXT_PUBLIC_ORG_NAME: 'Elevate for Humanity',
  NEXT_PUBLIC_ORG_LEGAL_NAME: 'Elevate for Humanity Technical and Career Institute',
  NEXT_PUBLIC_SUPPORT_EMAIL: 'support@elevateforhumanity.org',
  NEXT_PUBLIC_SUPPORT_PHONE: '(317) 314-3757',
  NEXT_PUBLIC_EMAIL_FROM_NAME: 'Elevate for Humanity',
  NEXT_PUBLIC_EMAIL_FROM_ADDRESS: 'noreply@elevateforhumanity.org',
  NEXT_PUBLIC_CERT_HOLDER: 'Elevate for Humanity',
  DEVSTUDIO_DEVCONTAINER_MODE: 'github-only',
  COURSE_VIDEO_STORAGE_BACKEND: 'auto',
  COURSE_VIDEO_R2_MIN_BYTES: '5242880',
  REMOTION_RELEASE_BUNDLE_AFTER_RENDER: 'true',
};

const INFRA_KEYS = new Set([
  'PORT',
  'HOSTNAME',
  'NODE_ENV',
  'NEXT_TELEMETRY_DISABLED',
  'SERVICE_ROLE',
  'SERVICE_NAME',
  'STORE_ONLY_RUNTIME',
]);

function loadManifestKeys(): string[] {
  return readFileSync(MANIFEST, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function loadFromProcessEnv(keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    if (INFRA_KEYS.has(k)) continue;
    const v = process.env[k];
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

function loadFromFile(path: string): Record<string, string> {
  if (!existsSync(path)) throw new Error(`File not found: ${path}`);
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
  for (const key of INFRA_KEYS) delete parsed[key];
  return parsed;
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

  const restrictions = serviceIds.length > 0
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
      description: 'Elevate shared production secrets/config',
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
  if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');

  const keys = loadManifestKeys();
  let variables: Record<string, string> = { ...STATIC_ENV };

  if (file) variables = { ...variables, ...loadFromFile(file) };
  variables = { ...variables, ...loadFromProcessEnv(keys) };
  variables = dedupeSecretVariables(variables);
  for (const key of INFRA_KEYS) delete variables[key];

  const missingCritical = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'STRIPE_SECRET_KEY',
    'SENDGRID_API_KEY',
  ].filter((k) => !variables[k]?.trim());

  console.log(dryRun ? '=== DRY RUN ===' : '=== EXECUTE ===');
  console.log(`Project: ${projectId}`);
  console.log(`Variables to sync: ${Object.keys(variables).length}`);
  console.log(`Infrastructure keys excluded: ${[...INFRA_KEYS].join(', ')}`);

  if (missingCritical.length) {
    console.warn(`Missing CRITICAL keys: ${missingCritical.join(', ')}`);
  }

  if (dryRun) {
    process.exit(missingCritical.length ? 1 : 0);
  }

  if (missingCritical.length) {
    throw new Error(
      `Refusing to update production secret group with missing critical keys: ${missingCritical.join(', ')}`,
    );
  }

  const lmsId = resolveLmsServiceId() || 'elevate-lms';
  const adminId = resolveAdminServiceId() || 'elevate-admin';
  const marketingId = process.env.NORTHFLANK_MARKETING_SERVICE_ID || 'elevate-marketing';
  const storeId = process.env.NORTHFLANK_STORE_SERVICE_ID?.trim();

  // The standalone GPU service is intentionally excluded here because it lives
  // in NORTHFLANK_GPU_PROJECT_ID, not this main web project.
  const serviceIds = [...new Set([
    marketingId,
    lmsId,
    adminId,
    ...(storeId ? [storeId] : []),
  ])];

  const groupId = await findOrCreateSecretGroup(projectId, secretId, serviceIds);
  const restrictions = {
    restricted: true,
    nfObjects: serviceIds.map((id) => ({ id, type: 'service' as const })),
    tagMatchCondition: 'or' as const,
  };

  await nfFetch(projectApiPath(projectId, `/secrets/${groupId}`), {
    method: 'POST',
    body: JSON.stringify({
      name: groupId,
      description: 'Elevate shared production secrets/config',
      priority: 10,
      type: 'secret',
      secretType: 'environment',
      restrictions,
      secrets: { variables },
    }),
  });

  console.log(`Updated secret group "${groupId}" with ${Object.keys(variables).length} variables.`);
  console.log(`Attached to services: ${serviceIds.join(', ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
