#!/usr/bin/env tsx
// Deployment retrigger: 2026-08-20 zero-downtime rollout hardening.
/**
 * Canonical Northflank production service configurator.
 *
 * Covers all three production services:
 *   - elevate-marketing -> /Dockerfile.marketing
 *   - elevate-lms       -> /Dockerfile.northflank-lms
 *   - elevate-admin     -> /Dockerfile.northflank-admin
 *
 * This file owns infrastructure/runtime shape: Dockerfile, public port,
 * service role, runtime port, zero-downtime rollout strategy, health probes,
 * billing, and build storage. Privileged credentials are managed separately
 * by sync-env.ts through the shared elevate-production-env secret group.
 */

import {
  combinedServicePatchPath,
  nfFetch,
  projectApiPath,
  resolveAdminServiceId,
  resolveLmsServiceId,
  resolveProjectId,
} from './lib';
import { resolveTargetServiceIds } from './service-targets';

type ServiceRole = 'marketing' | 'lms' | 'admin';
type ServiceConfig = {
  role: ServiceRole;
  id: string;
  dockerfile: string;
};

type RolloutMode = 'custom' | 'rollout-steady' | 'recreate';

const RUNTIME_PORT = 3000;
const DESIRED_INSTANCES = Number(
  process.env.NORTHFLANK_DESIRED_INSTANCES ||
    (process.env.NORTHFLANK_TARGET_SERVICE === 'admin' ? 2 : 1),
);
const BUILDKIT_CACHE_MB = 32768;

export const NORTHFLANK_SERVICE_CONFIGS: ServiceConfig[] = [
  {
    role: 'marketing',
    id: process.env.NORTHFLANK_MARKETING_SERVICE_ID || 'elevate-marketing',
    dockerfile: '/Dockerfile.marketing',
  },
  {
    role: 'lms',
    id: process.env.NORTHFLANK_LMS_SERVICE_ID || resolveLmsServiceId() || 'elevate-lms',
    dockerfile: '/Dockerfile.northflank-lms',
  },
  {
    role: 'admin',
    id: process.env.NORTHFLANK_ADMIN_SERVICE_ID || resolveAdminServiceId() || 'elevate-admin',
    dockerfile: '/Dockerfile.northflank-admin',
  },
];

const ALLOWED_EPHEMERAL_STORAGE_MB = [16384, 32768, 65536, 131072, 262144, 524288] as const;

function resolveEphemeralStorageMb(): number {
  const requested = Number(process.env.NORTHFLANK_EPHEMERAL_STORAGE_MB || 32768);
  if (
    ALLOWED_EPHEMERAL_STORAGE_MB.includes(
      requested as (typeof ALLOWED_EPHEMERAL_STORAGE_MB)[number],
    )
  ) {
    return requested;
  }
  const sorted = [...ALLOWED_EPHEMERAL_STORAGE_MB].sort((a, b) => a - b);
  return sorted.find((size) => size >= requested) ?? sorted[sorted.length - 1]!;
}

function storageAllowanceCandidates(requestedMb: number): number[] {
  return [requestedMb, 32768, 16384].filter(
    (size, index, arr) =>
      ALLOWED_EPHEMERAL_STORAGE_MB.includes(
        size as (typeof ALLOWED_EPHEMERAL_STORAGE_MB)[number],
      ) && arr.indexOf(size) === index,
  );
}

function isStorageAllowanceError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('build resource allowance') || msg.includes('ephemeral storage exceeds');
}

function requirePublicBuildArgs(): Record<string, string> {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length) {
    throw new Error(`Missing required Northflank build arguments: ${missing.join(', ')}`);
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
    NEXT_PUBLIC_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org',
    NEXT_PUBLIC_ADMIN_URL:
      process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org',
    NEXT_PUBLIC_LMS_URL: process.env.NEXT_PUBLIC_LMS_URL || 'https://app.elevateforhumanity.org',
  };
}

function runtimeEnvironmentFor(service: ServiceConfig): Record<string, string> {
  return {
    SERVICE_ROLE: service.role,
    SERVICE_NAME: service.id,
    PORT: String(RUNTIME_PORT),
    HOSTNAME: '0.0.0.0',
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
  };
}

function deploymentFor(mode: RolloutMode) {
  const strategy =
    mode === 'recreate'
      ? { type: 'recreate' }
      : mode === 'custom'
        ? {
            type: 'custom',
            settings: {
              maxSurge: 1,
              maxUnavailable: 0,
            },
          }
        : {
            type: 'rollout-steady',
          };

  return {
    type: 'deployment',
    instances: DESIRED_INSTANCES,
    docker: { configType: 'default' },
    strategy,
    gracePeriodSeconds: 60,
  };
}

const healthChecks = [
  {
    protocol: 'HTTP',
    type: 'startupProbe',
    path: '/api/ping',
    port: RUNTIME_PORT,
    initialDelaySeconds: 15,
    periodSeconds: 10,
    timeoutSeconds: 5,
    failureThreshold: 24,
  },
  {
    protocol: 'HTTP',
    type: 'readinessProbe',
    path: '/api/ready',
    port: RUNTIME_PORT,
    initialDelaySeconds: 5,
    periodSeconds: 10,
    timeoutSeconds: 5,
    failureThreshold: 3,
    successThreshold: 1,
  },
  {
    protocol: 'HTTP',
    type: 'livenessProbe',
    path: '/api/ping',
    port: RUNTIME_PORT,
    initialDelaySeconds: 60,
    periodSeconds: 30,
    timeoutSeconds: 5,
    failureThreshold: 3,
  },
];

const billing = {
  deploymentPlan: process.env.NORTHFLANK_DEPLOYMENT_PLAN || 'nf-compute-400',
  buildPlan: process.env.NORTHFLANK_BUILD_PLAN || 'nf-compute-800-32',
};

function buildPatch(
  service: ServiceConfig,
  storageMb: number,
  rolloutMode: RolloutMode,
  existingRuntimeEnvironment: Record<string, string>,
) {
  return {
    billing,
    disabledCI: true,
    deployment: deploymentFor(rolloutMode),
    ports: [
      {
        name: 'site',
        internalPort: RUNTIME_PORT,
        protocol: 'HTTP',
        public: true,
      },
    ],
    // Infrastructure deploys must not erase feature-specific runtime settings
    // (for example Studio Browser, OAuth, mail, or worker endpoints).
    runtimeEnvironment: {
      ...existingRuntimeEnvironment,
      ...runtimeEnvironmentFor(service),
    },
    buildArguments: requirePublicBuildArgs(),
    healthChecks,
    buildSettings: {
      storage: { ephemeralStorage: { storageSize: storageMb } },
      dockerfile: {
        buildEngine: 'buildkit',
        dockerFilePath: service.dockerfile,
        dockerWorkDir: '/',
        buildkit: { useCache: true, cacheStorageSize: BUILDKIT_CACHE_MB },
      },
    },
    buildConfiguration: {
      storage: { ephemeralStorage: { storageSize: storageMb } },
    },
  };
}

async function patchWithCapacitySafeStrategy(
  projectId: string,
  service: ServiceConfig,
  storageMb: number,
): Promise<{ response: Record<string, any>; rolloutMode: RolloutMode }> {
  const path = combinedServicePatchPath(projectId, service.id);
  const current = await nfFetch<{ runtimeEnvironment?: Record<string, string> }>(
    projectApiPath(projectId, `/services/${service.id}`),
  );
  const existingRuntimeEnvironment = current.runtimeEnvironment ?? {};

  // Production must remain available during deployments. Keep desired capacity
  // unchanged, allow one temporary surge instance, and never make an existing
  // healthy instance unavailable until its replacement passes readiness.
  // This provides zero-downtime rollouts even for services whose steady-state
  // desired replica count is one.
  const rolloutMode: RolloutMode = 'custom';
  const response = await nfFetch<Record<string, any>>(path, {
    method: 'PATCH',
    body: JSON.stringify(buildPatch(service, storageMb, rolloutMode, existingRuntimeEnvironment)),
  });
  return { response, rolloutMode };
}

async function configureService(
  projectId: string,
  service: ServiceConfig,
  requestedEphemeralMb: number,
) {
  let response: Record<string, any> | undefined;
  let appliedEphemeralMb = requestedEphemeralMb;
  let appliedRolloutMode: RolloutMode | undefined;

  for (const storageMb of storageAllowanceCandidates(requestedEphemeralMb)) {
    try {
      const patched = await patchWithCapacitySafeStrategy(projectId, service, storageMb);
      response = patched.response;
      appliedRolloutMode = patched.rolloutMode;
      appliedEphemeralMb = storageMb;
      break;
    } catch (error) {
      const candidates = storageAllowanceCandidates(requestedEphemeralMb);
      if (!isStorageAllowanceError(error) || storageMb === candidates.at(-1)) throw error;
      console.warn(`[patch-retry] ${service.id}: ${storageMb}MB rejected; trying smaller size`);
    }
  }

  if (!response || !appliedRolloutMode) throw new Error(`Failed to patch ${service.id}`);

  try {
    await nfFetch(projectApiPath(projectId, `/services/${service.id}/build-options`), {
      method: 'POST',
      body: JSON.stringify({
        storage: { ephemeralStorage: { storageSize: appliedEphemeralMb } },
      }),
    });
  } catch (error) {
    console.warn(
      `[build-options-warn] ${service.id}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const availabilitySummary =
    appliedRolloutMode === 'custom' ? 'maxUnavailable=0 maxSurge=1' : appliedRolloutMode;

  console.info(
    `[patch-ok] ${service.role}:${service.id} dockerfile=${service.dockerfile} ` +
      `port=${RUNTIME_PORT} instances=${DESIRED_INSTANCES} rollout=${appliedRolloutMode} ` +
      `${availabilitySummary} health=startup:/api/ping,readiness:/api/ready,liveness:/api/ping ` +
      `ci=github-actions buildPlan=${billing.buildPlan} deploymentPlan=${billing.deploymentPlan} ` +
      `ephemeralMB=${appliedEphemeralMb} buildkitCacheMB=${BUILDKIT_CACHE_MB}`,
  );
}

async function main() {
  const dryRun = !process.argv.includes('--execute');
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');

  const targetIds = new Set(resolveTargetServiceIds());
  const services = NORTHFLANK_SERVICE_CONFIGS.filter((service) => targetIds.has(service.id));

  if (services.length !== targetIds.size) {
    const configured = new Set(services.map((s) => s.id));
    const missing = [...targetIds].filter((id) => !configured.has(id));
    throw new Error(`No canonical service configuration for: ${missing.join(', ')}`);
  }

  const requestedEphemeralMb = resolveEphemeralStorageMb();
  console.info(dryRun ? '=== DRY RUN ===' : '=== EXECUTE ===');
  console.info(`Project: ${projectId}`);
  console.info(`Targets: ${services.map((s) => `${s.role}:${s.id}`).join(', ')}`);

  if (dryRun) {
    const rolloutMode: RolloutMode = 'custom';
    for (const service of services) {
      console.info(
        `[dry-run] ${service.id} -> ${service.dockerfile}, port=${RUNTIME_PORT}, instances=${DESIRED_INSTANCES}, ` +
          `rollout=${rolloutMode}, maxUnavailable=0, maxSurge=1, ` +
          `health=startup:/api/ping,readiness:/api/ready,liveness:/api/ping, ` +
          `ci=github-actions, buildkitCacheMB=${BUILDKIT_CACHE_MB}`,
      );
    }
    return;
  }

  for (const service of services) {
    await configureService(projectId, service, requestedEphemeralMb);
  }

  console.info(
    'Northflank zero-downtime configuration applied to all requested production services.',
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
