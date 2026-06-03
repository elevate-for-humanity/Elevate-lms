#!/usr/bin/env tsx
/**
 * Pull Supabase URL/keys from platform_secrets (live DB) and push to Northflank
 * elevate-production-env, then trigger admin + LMS rebuilds.
 *
 *   NORTHFLANK_PROJECT_ID=elevate-platform pnpm tsx scripts/northflank/sync-supabase-secrets.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'node:child_process';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
] as const;

async function loadFromPlatformSecrets(): Promise<Record<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env');
  }

  const db = createClient(url, serviceKey);
  const out: Record<string, string> = {};

  for (const table of ['platform_secrets', 'app_secrets'] as const) {
    const cols = table === 'platform_secrets' ? 'key, value_enc' : 'key, value';
    const { data, error } = await db.from(table).select(cols).in('key', [...KEYS]);
    if (error) continue;
    for (const row of data ?? []) {
      const v = String(
        (row as { value_enc?: string; value?: string }).value_enc ??
          (row as { value?: string }).value ??
          '',
      ).trim();
      if (!v || v === 'placeholder' || v === 'build-placeholder') continue;
      out[row.key] = v;
    }
  }

  if (out.NEXT_PUBLIC_SUPABASE_ANON_KEY && !out.SUPABASE_ANON_KEY) {
    out.SUPABASE_ANON_KEY = out.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  return out;
}

async function patchSecretGroup(projectId: string, groupId: string, patch: Record<string, string>) {
  const existing = await nfFetch<{ secrets?: { variables?: Record<string, string> } }>(
    projectApiPath(projectId, `/secrets/${groupId}`),
  );
  const variables = { ...(existing.secrets?.variables ?? {}), ...patch };
  await nfFetch(projectApiPath(projectId, `/secrets/${groupId}`), {
    method: 'POST',
    body: JSON.stringify({
      name: groupId,
      description: 'Elevate production env (Supabase keys synced from platform_secrets)',
      priority: 10,
      type: 'secret',
      secretType: 'environment',
      secrets: { variables },
    }),
  });
  return Object.keys(variables).length;
}

async function main() {
  const execute = process.argv.includes('--execute');
  const projectId = resolveProjectId() || 'elevate-platform';
  const groupId = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';

  const patch = await loadFromPlatformSecrets();
  const missing = KEYS.filter((k) => !patch[k] && k !== 'SUPABASE_ANON_KEY');
  if (missing.length) {
    console.error('Missing keys in platform_secrets:', missing.join(', '));
    process.exit(1);
  }

  console.log('Loaded from platform_secrets:');
  for (const k of Object.keys(patch)) {
    const v = patch[k];
    console.log(`  ${k}: ${v.startsWith('eyJ') ? `JWT (${v.length} chars)` : `set (${v.length} chars)`}`);
  }

  if (!execute) {
    console.log('\nDry run — pass --execute to update Northflank and redeploy');
    return;
  }

  const total = await patchSecretGroup(projectId, groupId, patch);
  console.log(`\nUpdated "${groupId}" (${total} variables total)`);

  for (const svc of ['elevate-admin', 'elevate-lms']) {
    const build = await nfFetch<{ id?: string; status?: string }>(
      projectApiPath(projectId, `/services/${svc}/build`),
      { method: 'POST', body: JSON.stringify({}) },
    );
    console.log(`Triggered ${svc} build:`, build.id ?? build.status);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
