#!/usr/bin/env tsx
/**
 * Northflank-only admin sync — pulls env from Supabase platform_secrets (no AWS).
 *
 *   NORTHFLANK_PROJECT_ID=elevate-platform pnpm tsx scripts/northflank/sync-admin-from-db.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  combinedServicePath,
  nfFetch,
  projectApiPath,
  resolveAdminServiceId,
  resolveProjectId,
} from './lib';

const __dir = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(__dir, 'env-keys-manifest.txt');

const ADMIN_RUNTIME_BASE: Record<string, string> = {
  PORT: '8080',
  HOSTNAME: '0.0.0.0',
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
  SERVICE_ROLE: 'admin',
  NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
  NEXT_PUBLIC_SITE_URL: 'https://admin.elevateforhumanity.org',
  NEXT_PUBLIC_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
  NEXT_PUBLIC_LMS_URL: 'https://www.elevateforhumanity.org/lms',
  SUPABASE_PROJECT_REF: 'cuxzzpsyufcewtmicszk',
};

function isPlaceholder(v: string): boolean {
  const t = v.trim();
  return !t || t === 'placeholder' || t === 'build-placeholder' || /placeholder/i.test(t);
}

async function loadPlatformSecrets(): Promise<Record<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Cursor secrets');
  }

  const db = createClient(url, key);
  const { data, error } = await db.from('platform_secrets').select('key, value_enc');
  if (error) throw new Error(`platform_secrets: ${error.message}`);

  const out: Record<string, string> = {};
  for (const row of data ?? []) {
    const k = String(row.key ?? '').trim();
    const v = String(row.value_enc ?? row.value ?? '').trim();
    if (!k || isPlaceholder(v)) continue;
    out[k] = v;
  }

  // Runtime keys (not inlined at build) — required for admin auth after Docker build
  if (out.NEXT_PUBLIC_SUPABASE_URL) {
    out.SUPABASE_URL = out.SUPABASE_URL || out.NEXT_PUBLIC_SUPABASE_URL;
  }
  if (out.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    out.SUPABASE_ANON_KEY = out.SUPABASE_ANON_KEY || out.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  return out;
}

async function updateSecretGroup(
  projectId: string,
  groupId: string,
  variables: Record<string, string>,
  serviceIds: string[],
) {
  const restrictions = {
    restricted: true,
    nfObjects: serviceIds.map((id) => ({ id, type: 'service' as const })),
    tagMatchCondition: 'or' as const,
  };

  await nfFetch(projectApiPath(projectId, `/secrets/${groupId}`), {
    method: 'POST',
    body: JSON.stringify({
      name: groupId,
      description: 'Elevate production (synced from platform_secrets — Northflank only)',
      priority: 10,
      type: 'secret',
      secretType: 'environment',
      restrictions,
      secrets: { variables },
    }),
  });
}

async function setAdminRuntime(projectId: string, env: Record<string, string>) {
  const team = process.env.NORTHFLANK_TEAM_ID || 'elevates-team';
  const adminId = resolveAdminServiceId() || 'elevate-admin';
  const url = `https://api.northflank.com/v1/teams/${team}/projects/${projectId}/services/${adminId}/runtime-environment`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NORTHFLANK_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ runtimeEnvironment: env }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`runtime-environment ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text) as { data?: { restartSuccessful?: boolean } };
}

async function main() {
  const execute = process.argv.includes('--execute');
  const projectId = resolveProjectId() || 'elevate-platform';
  const groupId = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';
  const adminId = resolveAdminServiceId() || 'elevate-admin';
  const lmsId = process.env.NORTHFLANK_LMS_SERVICE_ID || 'elevate-lms';

  const fromDb = await loadPlatformSecrets();
  const manifestKeys = readFileSync(MANIFEST, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const variables: Record<string, string> = { ...ADMIN_RUNTIME_BASE };
  for (const k of manifestKeys) {
    if (fromDb[k]) variables[k] = fromDb[k];
  }
  // Also include any platform_secrets keys used by admin (cap size for Northflank API)
  const extraKeys = Object.keys(fromDb).filter((k) => !manifestKeys.includes(k));
  for (const k of extraKeys.slice(0, 80)) {
    variables[k] = fromDb[k];
  }

  delete variables.AWS_ACCESS_KEY_ID;
  delete variables.AWS_SECRET_ACCESS_KEY;
  delete variables.AWS_SESSION_TOKEN;

  const critical = [
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
  ];
  const missing = critical.filter((k) => !variables[k]);
  if (missing.length) {
    console.error('Missing after platform_secrets sync:', missing.join(', '));
    process.exit(1);
  }

  console.log(`platform_secrets → ${Object.keys(fromDb).length} keys`);
  console.log(
    `  SUPABASE_ANON_KEY: JWT (${variables.SUPABASE_ANON_KEY.length} chars)`,
  );
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: JWT (${variables.SUPABASE_SERVICE_ROLE_KEY.length} chars)`);

  if (!execute) {
    console.log('\nDry run — pass --execute to push to Northflank + rebuild admin');
    return;
  }

  await updateSecretGroup(projectId, groupId, variables, [lmsId, adminId]);
  console.log(`Updated secret group "${groupId}"`);

  const runtimeResult = await setAdminRuntime(projectId, {
    ...ADMIN_RUNTIME_BASE,
    NEXT_PUBLIC_SUPABASE_URL: variables.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: variables.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_URL: variables.SUPABASE_URL!,
    SUPABASE_ANON_KEY: variables.SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: variables.SUPABASE_SERVICE_ROLE_KEY,
    NEXTAUTH_SECRET: variables.NEXTAUTH_SECRET,
  });
  console.log('Admin runtime restart:', runtimeResult.data?.restartSuccessful ?? 'unknown');

  await nfFetch(combinedServicePath(projectId, adminId), {
    method: 'PATCH',
    body: JSON.stringify({ vcsData: { projectBranch: 'main' } }),
  });

  const build = await nfFetch<{ id?: string }>(
    projectApiPath(projectId, `/services/${adminId}/build`),
    { method: 'POST', body: JSON.stringify({}) },
  );
  console.log(`Admin build triggered: ${build.id ?? 'pending'} (needs main @ PR #224+)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
