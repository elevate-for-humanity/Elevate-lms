#!/usr/bin/env tsx
import { combinedServicePatchPath, nfFetch, projectApiPath, resolveProjectId } from './lib';

type NorthflankService = {
  serviceType?: string;
  status?: string;
  billing?: {
    deploymentPlan?: string;
    buildPlan?: string;
  };
  deployment?: {
    internal?: {
      id?: string;
      deployedSHA?: string;
      buildId?: string;
      branch?: string;
    };
  };
  deploymentStatus?: {
    status?: string;
    lastTransitionTime?: string;
    updatedAt?: string;
  };
  vcsData?: {
    projectBranch?: string;
    dockerFilePath?: string;
    dockerWorkDir?: string;
  };
  buildSettings?: {
    dockerfile?: {
      dockerFilePath?: string;
      dockerWorkDir?: string;
      buildEngine?: string;
      buildkit?: unknown;
    };
    storage?: {
      ephemeralStorage?: {
        storageSize?: number;
      };
    };
  };
  buildConfiguration?: {
    storage?: {
      ephemeralStorage?: {
        storageSize?: number;
      };
    };
  };
  healthChecks?: Array<{ type?: string; path?: string; port?: number }>;
};

type CombinedService = {
  healthChecks?: Array<{ type?: string; path?: string; port?: number }>;
};

async function main() {
  const pid = resolveProjectId();
  if (!pid) process.exit(1);
  for (const sid of ['elevate-admin', 'elevate-lms']) {
    const s = await nfFetch<NorthflankService>(projectApiPath(pid, `/services/${sid}`));
    // Combined service health probes are only returned on PATCH (GET returns 405).
    // Run configure-services --execute or verify-health-checks.ts to confirm probes.
    let combinedHealth: CombinedService['healthChecks'];
    combinedHealth = undefined;
    const dockerfile =
      s.vcsData?.dockerFilePath ??
      s.buildSettings?.dockerfile?.dockerFilePath ??
      null;
    const ephemeralStorage =
      s.buildConfiguration?.storage?.ephemeralStorage?.storageSize ??
      s.buildSettings?.storage?.ephemeralStorage?.storageSize ??
      null;

    console.info(
      JSON.stringify(
        {
          id: sid,
          serviceType: s.serviceType ?? null,
          branch: s.vcsData?.projectBranch ?? s.deployment?.internal?.branch ?? null,
          dockerfile,
          deploymentPlan: s.billing?.deploymentPlan ?? null,
          buildPlan: s.billing?.buildPlan ?? null,
          ephemeralStorageMb: ephemeralStorage,
          buildkit: s.buildSettings?.dockerfile?.buildkit ?? null,
          deploymentStatus: s.deploymentStatus?.status ?? s.status ?? null,
          currentDeployment: s.deployment?.internal
            ? {
                id: s.deployment.internal.id ?? null,
                buildId: s.deployment.internal.buildId ?? null,
                deployedSHA: s.deployment.internal.deployedSHA ?? null,
              }
            : null,
          healthChecks:
            combinedHealth?.map((p) => `${p.type}:${p.path}:${p.port}`) ??
            (Array.isArray(s.healthChecks) ? s.healthChecks : null),
          lastTransitionTime:
            s.deploymentStatus?.lastTransitionTime ?? s.deploymentStatus?.updatedAt ?? null,
        },
        null,
        2,
      ),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
