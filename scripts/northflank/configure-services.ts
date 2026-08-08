#!/usr/bin/env tsx
/**
 * Canonical Northflank production service configurator.
 *
 * Covers all three production services:
 *   - elevate-marketing -> /Dockerfile.marketing
 *   - elevate-lms       -> /Dockerfile.northflank-lms
 *   - elevate-admin     -> /Dockerfile.northflank-admin
 *
 * This file owns infrastructure/runtime shape: Dockerfile, public port,
 * service role, runtime port, health probes, billing, and build storage.
 * Privileged credentials are managed separately by sync-env.ts through the
 * shared elevate-production-env secret group.
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

const RUNTIME_PORT = 3000;

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
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
    NEXT_PUBLIC_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org',
    NEXT_PUBLIC_ADMIN_URL:
      process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org',
    NEXT_PUBLIC_LMS_URL:
      process.env.NEXT_PUBLIC_LMS_URL || 'https://app.elevateforhumanity.org',
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

const healthChecks = [
  {
    protocol: 'HTTP',
    type: 'startupProbe',
    path: '/api/ping',
    port: RUNTIME_PORT,
    initialDelaySeconds: 60,
    periodSeconds: 10,
    timeoutSeconds: 10,
    failureThreshold: 12,
  },
  {
    protocol: 'HTTP',
    type: 'readinessProbe',
    path: '/api/health',
    port: RUNTIME_PORT,
    initialDelaySeconds: 30,
    periodSeconds: 10,
    timeoutSeconds: 10,
    failureThreshold: 3,
    successThreshold: 1,
  },
  {
    protocol: 'HTTP',
    type: 'livenessProbe',
    path: '/api/ping',
    port: RUNTIME_PORT,
    initialDelaySeconds: 120,
    periodSeconds: 30,
    timeoutSeconds: 10,
    failureThreshold: 3,
  },
];

const billing = {
  deploymentPlan: process.env.NORTHFLANK_DEPLOYMENT_PLAN || 'nf-compute-400',
  buildPlan: process.env.NORTHFLANK_BUILD_PLAN || 'nf-compute-800-32',
};

async function configureService(
  projectId: string,
  service: ServiceConfig,
  requestedEphemeralMb: number,
) {
  const buildArguments = requirePublicBuildArgs();
  let response: Record<string, any> | undefined;
  let appliedEphemeralMb = requestedEphemeralMb;

  for (const storageMb of storageAllowanceCandidates(requestedEphemeralMb)) {
    const patch = {
      billing,
      disabledCI: true,
      ports: [
        {
          name: 'site',
          internalPort: RUNTIME_PORT,
          protocol: 'HTTP',
          public: true,
        },
      ],
      runtimeEnvironment: runtimeEnvironmentFor(service),
      buildArguments,
      healthChecks,
      buildSettings: {
        storage: { ephemeralStorage: { storageSize: storageMb } },
        dockerfile: {
          buildEngine: 'buildkit',
          dockerFilePath: service.dockerfile,
          dockerWorkDir: '/',
          buildkit: { useCache: false, cacheStorageSize: 0 },
        },
      },
      buildConfiguration: {
        storage: { ephemeralStorage: { storageSize: storageMb } },
      },
    };

    try {
      response = await nfFetch<Record<string, any>>(
        combinedServicePatchPath(projectId, service.id),
        { method: 'PATCH', body: JSON.stringify(patch) },
      );
      appliedEphemeralMb = storageMb;
      break;
    } catch (error) {
      const candidates = storageAllowanceCandidates(requestedEphemeralMb);
      if (!isStorageAllowanceError(error) || storageMb === candidates.at(-1)) throw error;
      console.warn(`[patch-retry] ${service.id}: ${storageMb}MB rejected; trying smaller size`);
    }
  }

  if (!response) throw new Error(`Failed to patch ${service.id}`);

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

  console.info(
    `[patch-ok] ${service.role}:${service.id} dockerfile=${service.dockerfile} ` +
      `port=${RUNTIME_PORT} health=startup:/api/ping,readiness:/api/health,liveness:/api/ping ci=github-actions ` +
      `buildPlan=${billing.buildPlan} deploymentPlan=${billing.deploymentPlan} ` +
      `ephemeralMB=${appliedEphemeralMb}`,
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
    for (const service of services) {
      console.info(
        `[dry-run] ${service.id} -> ${service.dockerfile}, port=${RUNTIME_PORT}, health=startup:/api/ping,readiness:/api/health,liveness:/api/ping ci=github-actions`,
      );
    }
    return;
  }

  for (const service of services) {
    await configureService(projectId, service, requestedEphemeralMb);
  }

  console.info('Northflank configuration applied to all requested production services.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
