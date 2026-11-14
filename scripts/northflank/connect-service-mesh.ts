#!/usr/bin/env tsx
/**
 * Give Marketing, LMS, and Admin one explicit Northflank service-topology
 * contract while keeping them independently deployable.
 *
 * This patches only service-owned runtime variables. Shared secrets continue to
 * come from elevate-production-env via sync-env.ts.
 */

import { combinedServicePatchPath, nfFetch, resolveProjectId } from './lib';
import { NORTHFLANK_SERVICE_TARGETS } from './service-targets';

const PORT = 3000;
const topologyVersion = process.env.EXPECTED_SHA || process.env.GITHUB_SHA || 'runtime';

const ids = Object.fromEntries(NORTHFLANK_SERVICE_TARGETS.map((target) => [target.role, target.id])) as Record<'marketing' | 'lms' | 'admin', string>;

const publicUrls = {
  marketing: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
  lms: process.env.NEXT_PUBLIC_LMS_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org',
  admin: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org',
};

const internalUrls = {
  marketing: `http://${ids.marketing}:${PORT}`,
  lms: `http://${ids.lms}:${PORT}`,
  admin: `http://${ids.admin}:${PORT}`,
};

function runtime(role: 'marketing' | 'lms' | 'admin', id: string) {
  return {
    SERVICE_ROLE: role,
    SERVICE_NAME: id,
    PORT: String(PORT),
    HOSTNAME: '0.0.0.0',
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    PLATFORM_TOPOLOGY_VERSION: topologyVersion,
    PLATFORM_MARKETING_URL: publicUrls.marketing,
    PLATFORM_LMS_URL: publicUrls.lms,
    PLATFORM_ADMIN_URL: publicUrls.admin,
    INTERNAL_MARKETING_URL: internalUrls.marketing,
    INTERNAL_LMS_URL: internalUrls.lms,
    INTERNAL_ADMIN_URL: internalUrls.admin,
  };
}

async function main() {
  const execute = process.argv.includes('--execute');
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');

  for (const target of NORTHFLANK_SERVICE_TARGETS) {
    const env = runtime(target.role, target.id);
    if (!execute) {
      console.log(`[dry-run] ${target.id}`, env);
      continue;
    }
    await nfFetch(combinedServicePatchPath(projectId, target.id), {
      method: 'PATCH',
      body: JSON.stringify({ runtimeEnvironment: env }),
    });
    console.log(`[mesh-ok] ${target.role}:${target.id} topology=${topologyVersion}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
