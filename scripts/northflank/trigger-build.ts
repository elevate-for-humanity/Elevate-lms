#!/usr/bin/env tsx
/**
 * Trigger a Northflank build for a service.
 *
 * VERIFIED ENDPOINTS (2026-08-04):
 *   ✅ PATCH  /services/combined/{id}  <- config + triggers build (no build_id returned)
 *   ✅ POST   /services/{id}/build     <- triggers build, RETURNS build_id (needs 40-char SHA)
 *   ✅ GET    /services/{id}           <- service info
 *
 * Two-step approach:
 *   1. PATCH combined/{id} to set buildArguments + internal.{branch, buildSHA}
 *   2. POST {id}/build with full SHA to get build_id for tracking
 *
 *   npx tsx scripts/northflank/trigger-build.ts elevate-lms
 *   npx tsx scripts/northflank/trigger-build.ts elevate-admin
 */

import fs from 'node:fs';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

interface NorthflankBuildResponse {
  id: string;
  status: string;
  sha?: string;
  concluded?: boolean;
  createdAt?: string;
}

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required but was not provided.`);
  }
  return value;
}

async function getExistingBuildArguments(
  projectId: string,
  serviceId: string,
): Promise<Record<string, string>> {
  try {
    const combinedPath = projectApiPath(projectId, `/services/combined/${serviceId}`);
    const service = await nfFetch<Record<string, unknown>>(combinedPath);
    const args = service['buildArguments'] as Record<string, string> | undefined;
    if (args && Object.keys(args).length > 0) {
      console.log(`Found buildArguments at ${combinedPath}:`, Object.keys(args));
      return args;
    }
  } catch {
    // Fall through
  }
  console.log('No existing buildArguments found');
  return {};
}

async function main() {
  const serviceId = process.argv[2];
  if (!serviceId) {
    console.error('Usage: npx tsx scripts/northflank/trigger-build.ts <service-id>');
    process.exit(1);
  }
  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  const currentSha = process.env.GITHUB_SHA || process.env.BUILD_SHA || '';
  if (!currentSha) {
    console.error('No GITHUB_SHA or BUILD_SHA in environment');
    process.exit(1);
  }

  // Northflank POST /build requires exactly 40 hex characters
  if (currentSha.length !== 40) {
    console.error(
      `FATAL: SHA "${currentSha}" is ${currentSha.length} chars. ` +
      'Northflank POST /build requires exactly 40 hex characters.',
    );
    process.exit(1);
  }

  // ─── Build arguments ───────────────────────────────────────────────────────
  const nextPublicSupabaseUrl = requireEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL');
  const nextPublicSupabaseAnonKey = requireEnvironmentVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const nextPublicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
  const nextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.elevateforhumanity.org';
  const nextPublicAdminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.elevateforhumanity.org';

  const existingArgs = await getExistingBuildArguments(projectId, serviceId);
  const serviceName = serviceId.replace(/^elevate-/, '');

  const mergedBuildArguments: Record<string, string> = {
    ...existingArgs,

    // Supabase — REQUIRED for all services
    NEXT_PUBLIC_SUPABASE_URL: nextPublicSupabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: nextPublicSupabaseAnonKey,

    // URLs — REQUIRED for all services
    NEXT_PUBLIC_SITE_URL: nextPublicSiteUrl,
    NEXT_PUBLIC_APP_URL: nextPublicAppUrl,
    NEXT_PUBLIC_ADMIN_URL: nextPublicAdminUrl,

    // Build identity
    GITHUB_SHA: currentSha,
    GIT_SHA: currentSha,
    NEXT_PUBLIC_GIT_SHA: currentSha,
    NEXT_PUBLIC_BUILD_ID: `${serviceName}-${currentSha}`,
    NEXT_PUBLIC_COMMIT_SHA: currentSha,
    NEXT_PUBLIC_SERVICE_NAME: serviceName,
    BUILD_TIMESTAMP: new Date().toISOString(),
    FALLBACK_COMMIT: currentSha,
  };

  // ─── Validation ───────────────────────────────────────────────────────────
  for (const required of [
    'GIT_SHA',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]) {
    if (!mergedBuildArguments[required]) {
      throw new Error(`Missing required Northflank build argument: ${required}`);
    }
  }

  console.log('=== TRIGGER BUILD ===');
  console.log('Service:', serviceId);
  console.log('SHA:', currentSha);
  console.log('Build arguments:', Object.keys(mergedBuildArguments));

  // Step 1: PATCH combined/{id} to set buildArguments + trigger config build
  const patchPath = projectApiPath(projectId, `/services/combined/${serviceId}`);
  const patchPayload = {
    buildArguments: mergedBuildArguments,
    internal: { branch: 'main', buildSHA: currentSha },
  };

  console.log('PATCH combined/{id} to set buildArguments...');
  try {
    await nfFetch(patchPath, { method: 'PATCH', body: JSON.stringify(patchPayload) });
    console.log('PATCH ok');
  } catch (e) {
    console.error('PATCH failed:', e);
    process.exit(1);
  }

  // Step 2: POST /{id}/build with full SHA — returns build_id for tracking
  const buildPath = projectApiPath(projectId, `/services/${serviceId}/build`);
  console.log('POST /{id}/build to get build_id...');
  let buildId: string;
  try {
    const build = await nfFetch<NorthflankBuildResponse>(buildPath, {
      method: 'POST',
      body: JSON.stringify({ sha: currentSha, no_cache: true }),
    });
    console.log('Build response:', JSON.stringify(build, null, 2));
    buildId = build.id;
    if (!buildId) {
      console.error('Build response missing id:', build);
      process.exit(1);
    }
  } catch (e) {
    console.error('POST /build failed:', e);
    process.exit(1);
  }

  console.log(`✅ Build triggered: ${buildId}`);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `build_id=${buildId}\n`, 'utf8');
  }
  console.log('=== TRIGGER BUILD END ===');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
