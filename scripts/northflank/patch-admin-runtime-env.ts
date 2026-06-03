#!/usr/bin/env tsx
/**
 * Set elevate-admin (and optionally elevate-lms) runtime env from platform_secrets.
 * Service-level runtime env overrides secret groups and fixes build-placeholder leaks.
 *
 *   NORTHFLANK_PROJECT_ID=elevate-platform pnpm tsx scripts/northflank/patch-admin-runtime-env.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import { combinedServicePath, nfFetch, projectApiPath, resolveProjectId } from './lib';

const SUPABASE_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_URL',
] as const;

async function loadSupabaseEnv(): Promise<Record<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env');
  }
  const db = createClient(url, serviceKey);
  const out: Record<string, string> = {};
  for (const table of ['platform_secrets', 'app_secrets'] as const) {
    const cols = table === 'platform_secrets' ? 'key, value_enc' : 'key, value';
    const { data } = await db.from(table).select(cols).in('key', [...SUPABASE_KEYS]);
    for (const row of data ?? []) {
      const r = row as { value_enc?: string; value?: string };
      const v = String(r.value_enc ?? r.value ?? '').trim();
      if (!v || v === 'placeholder' || v === 'build-placeholder') continue;
      out[row.key] = v;
    }
  }
  if (out.NEXT_PUBLIC_SUPABASE_URL && !out.SUPABASE_URL) {
    out.SUPABASE_URL = out.NEXT_PUBLIC_SUPABASE_URL;
  }
  if (out.NEXT_PUBLIC_SUPABASE_ANON_KEY && !out.SUPABASE_ANON_KEY) {
    out.SUPABASE_ANON_KEY = out.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  return out;
}

async function patchRuntime(projectId: string, serviceId: string, runtimeEnvironment: Record<string, string>) {
  await nfFetch(combinedServicePath(projectId, serviceId), {
    method: 'PATCH',
    body: JSON.stringify({ runtimeEnvironment }),
  });
}

async function restartDeployment(projectId: string, serviceId: string) {
  try {
    await nfFetch(projectApiPath(projectId, `/services/${serviceId}/restart`), {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return 'restart';
  } catch {
    const build = await nfFetch(projectApiPath(projectId, `/services/${serviceId}/build`), {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return `build:${(build as { id?: string }).id ?? 'triggered'}`;
  }
}

async function main() {
  const execute = process.argv.includes('--execute');
  const projectId = resolveProjectId() || 'elevate-platform';
  const supabase = await loadSupabaseEnv();

  if (!supabase.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('No anon key in platform_secrets');
    process.exit(1);
  }

  console.log('Supabase runtime patch:');
  for (const [k, v] of Object.entries(supabase)) {
    console.log(`  ${k}: ${v.startsWith('eyJ') ? `JWT (${v.length})` : `set (${v.length})`}`);
  }

  const baseRuntime = {
    PORT: '8080',
    HOSTNAME: '0.0.0.0',
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    SERVICE_ROLE: 'admin',
    NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
    NEXT_PUBLIC_SITE_URL: 'https://admin.elevateforhumanity.org',
    NEXT_PUBLIC_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
    ...supabase,
  };

  if (!execute) {
    console.log('\nDry run — pass --execute to PATCH runtime + restart');
    return;
  }

  await patchRuntime(projectId, 'elevate-admin', baseRuntime);
  console.log('Patched elevate-admin runtimeEnvironment');

  const lmsRuntime = {
    ...supabase,
    PORT: '8080',
    HOSTNAME: '0.0.0.0',
    NODE_ENV: 'production',
    SERVICE_ROLE: 'lms',
    NEXT_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
    NEXT_PUBLIC_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
    NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
    NEXT_PUBLIC_LMS_URL: 'https://www.elevateforhumanity.org/lms',
  };
  await patchRuntime(projectId, 'elevate-lms', lmsRuntime);
  console.log('Patched elevate-lms runtimeEnvironment');

  for (const svc of ['elevate-admin', 'elevate-lms']) {
    const action = await restartDeployment(projectId, svc);
    console.log(`${svc}: ${action}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
