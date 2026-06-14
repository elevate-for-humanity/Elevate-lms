#!/usr/bin/env tsx
/**
 * Configure Northflank services (separate elevate-lms and elevate-admin).
 *
 * Applies per service:
 *   - Dockerfile path, BuildKit cache, runtime env, health probes on /api/ping:8080
 *
 * Usage:
 *   pnpm tsx scripts/northflank/configure-services.ts elevate-lms --dry-run
 *   pnpm tsx scripts/northflank/configure-services.ts elevate-admin --execute
 *   pnpm tsx scripts/northflank/configure-services.ts --all --execute
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

export const NORTHFLANK_SERVICE_CONFIGS = [
  {
    id: process.env.NORTHFLANK_LMS_SERVICE_ID || resolveLmsServiceId() || 'elevate-lms',
    dockerfile: '/Dockerfile.northflank-lms',
    runtimeEnvironment: {
      SERVICE_ROLE: 'lms',
      PORT: '8080',
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
      NEXT_PUBLIC_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
      NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
      NEXT_PUBLIC_LMS_URL: 'https://www.elevateforhumanity.org/lms',
    },
  },
  {
    id: process.env.NORTHFLANK_ADMIN_SERVICE_ID || resolveAdminServiceId() || 'elevate-admin',
    dockerfile: '/Dockerfile.northflank-admin',
    runtimeEnvironment: {
      SERVICE_ROLE: 'admin',
      PORT: '8080',
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_SITE_URL: 'https://admin.elevateforhumanity.org',
      NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
      NEXT_PUBLIC_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
      NEXT_PUBLIC_LMS_URL: 'https://www.elevateforhumanity.org/lms',
    },
  },
];

/** Northflank only accepts these MB values for build ephemeral storage. */
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
  const next = sorted.find((size) => size >= requested);
  const resolved = next ?? sorted[sorted.length - 1]!;
  console.warn(
    `NORTHFLANK_EPHEMERAL_STORAGE_MB=${requested} is invalid; using ${resolved} MB (allowed: ${ALLOWED_EPHEMERAL_STORAGE_MB.join(', ')})`,
  );
  return resolved;
}

// Do not default runtime to nf-compute-100-2 — every deploy would downgrade production (400 → 100).
const billing = {
  deploymentPlan: process.env.NORTHFLANK_DEPLOYMENT_PLAN || 'nf-compute-400',
  buildPlan: process.env.NORTHFLANK_BUILD_PLAN || 'nf-compute-800-32',
};

function storageAllowanceCandidates(requestedMb: number): number[] {
  const ordered = [requestedMb, 32768, 16384].filter(
    (size, index, arr) =>
      ALLOWED_EPHEMERAL_STORAGE_MB.includes(
        size as (typeof ALLOWED_EPHEMERAL_STORAGE_MB)[number],
      ) && arr.indexOf(size) === index,
  );
  return ordered;
}

function isStorageAllowanceError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('build resource allowance') || msg.includes('ephemeral storage exceeds');
}

function resolvePublicSupabaseBuildArguments(): Record<string, string> {
  const names = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required Northflank Docker build arguments: ${missing.join(', ')}. ` +
        'Set them as GitHub/Northflank secrets before running configure-services so Dockerfiles do not fall back to hardcoded public Supabase values.',
    );
  }

  return Object.fromEntries(names.map((name) => [name, process.env[name]!])) as Record<
    string,
    string
  >;
}

const healthChecks = [
  {
    protocol: 'HTTP',
    type: 'startupProbe',
    path: '/api/ping',
    port: 8080,
    initialDelaySeconds: 90,
    periodSeconds: 10,
    timeoutSeconds: 10,
    failureThreshold: 18,
  },
  {
    protocol: 'HTTP',
    type: 'readinessProbe',
    path: '/api/ping',
    port: 8080,
    initialDelaySeconds: 30,
    periodSeconds: 10,
    timeoutSeconds: 10,
    failureThreshold: 6,
    successThreshold: 1,
  },
];

async function main() {
  const dryRun = !process.argv.includes('--execute');
  const projectId = resolveProjectId();
  if (!projectId) {
    console.error('Set NORTHFLANK_PROJECT_ID');
    process.exit(1);
  }

  console.log(dryRun ? '=== DRY RUN ===' : '=== EXECUTE ===');
  console.log(`Project: ${projectId}`);

  const requestedEphemeralMb = resolveEphemeralStorageMb();

  const targetIds = new Set(resolveTargetServiceIds());
  const services = NORTHFLANK_SERVICE_CONFIGS.filter((s) => targetIds.has(s.id));
  if (services.length === 0) {
    console.error(`No services matched targets: ${[...targetIds].join(', ')}`);
    process.exit(1);
  }
  console.log(`Targets: ${services.map((s) => s.id).join(', ')}`);

  for (const service of services) {
    console.log(
      `${dryRun ? '[dry-run]' : '[patch]'} ${service.id} -> ${service.dockerfile}, build ${billing.buildPlan}, runtime ${billing.deploymentPlan}, ephemeral ${requestedEphemeralMb}MB (with allowance fallback), health /api/ping`,
    );

    if (!dryRun) {
      let response: Record<string, unknown> | undefined;
      let appliedEphemeralMb = requestedEphemeralMb;

      for (const storageMb of storageAllowanceCandidates(requestedEphemeralMb)) {
        const patch = {
          billing,
          // Builds must roll to pods automatically; disabledCD left admin 194 commits behind main.
          disabledCD: false,
          runtimeEnvironment: service.runtimeEnvironment,
          buildArguments: resolvePublicSupabaseBuildArguments(),
          healthChecks,
          buildSettings: {
            storage: {
              ephemeralStorage: {
                storageSize: storageMb,
              },
            },
            dockerfile: {
              buildEngine: 'buildkit',
              dockerFilePath: service.dockerfile,
              dockerWorkDir: '/',
              buildkit: {
                useCache: false,
                cacheStorageSize: 0,
              },
            },
          },
          buildConfiguration: {
            storage: {
              ephemeralStorage: {
                storageSize: storageMb,
              },
            },
          },
        };

        try {
          response = await nfFetch<Record<string, unknown>>(
            combinedServicePatchPath(projectId, service.id),
            {
              method: 'PATCH',
              body: JSON.stringify(patch),
            },
          );
          appliedEphemeralMb = storageMb;
          if (storageMb !== requestedEphemeralMb) {
            console.warn(
              `[patch-fallback] ${service.id} ephemeral ${requestedEphemeralMb}MB rejected; applied ${storageMb}MB`,
            );
          }
          break;
        } catch (e) {
          if (
            !isStorageAllowanceError(e) ||
            storageMb === storageAllowanceCandidates(requestedEphemeralMb).at(-1)
          ) {
            throw e;
          }
          console.warn(
            `[patch-retry] ${service.id} ephemeral ${storageMb}MB exceeds project allowance; trying smaller`,
          );
        }
      }

      if (!response) {
        throw new Error(`Failed to patch ${service.id}`);
      }

      const buildOptionsBody = {
        storage: { ephemeralStorage: { storageSize: appliedEphemeralMb } },
      };
      try {
        await nfFetch(projectApiPath(projectId, `/services/${service.id}/build-options`), {
          method: 'POST',
          body: JSON.stringify(buildOptionsBody),
        });
        console.log(`[build-options-ok] ${service.id} ephemeral ${appliedEphemeralMb}MB`);
      } catch (e) {
        console.warn(
          `[build-options-warn] ${service.id}:`,
          e instanceof Error ? e.message.slice(0, 200) : e,
        );
      }
      const appliedBuild =
        response?.billing?.buildPlan ??
        response?.buildSettings?.billing?.buildPlan ??
        billing.buildPlan;
      const appliedRuntime =
        response?.billing?.deploymentPlan ??
        response?.deployment?.billing?.deploymentPlan ??
        billing.deploymentPlan;
      const appliedStorage =
        (response?.buildSettings as { storage?: { ephemeralStorage?: { storageSize?: number } } })
          ?.storage?.ephemeralStorage?.storageSize ?? appliedEphemeralMb;
      const probes = Array.isArray(response?.healthChecks) ? response.healthChecks : healthChecks;
      const probeSummary = probes
        .map(
          (p: { type?: string; path?: string; port?: number }) =>
            `${p.type ?? '?'}:${p.path ?? '?'}:${p.port ?? '?'}`,
        )
        .join(', ');
      console.log(
        `[patch-ok] ${service.id} buildPlan=${appliedBuild} deploymentPlan=${appliedRuntime} buildEphemeralMB=${appliedStorage} health=[${probeSummary}]`,
      );
    }
  }

  if (dryRun) {
    console.log('\nRe-run with --execute to apply.');
  } else {
    console.log('\nNorthflank service configuration applied.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
