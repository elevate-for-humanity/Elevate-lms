import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import {
  getNorthflankProjectId,
  getNorthflankService,
  getNorthflankServices,
  isNorthflankReady,
} from '@/lib/northflank/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const tokenPresent = Boolean(
      process.env.NORTHFLANK_API_TOKEN || process.env.NORTHFLANK_API_KEY || process.env.NF_API_TOKEN,
    );
    const projectId = getNorthflankProjectId();
    const projectPresent = Boolean(projectId);
    const services = getNorthflankServices();
    const configuredServices = services.filter((service) => Boolean(service.id));
    const runtimeReady = isNorthflankReady();

    let apiReachable = false;
    let reachableServices = 0;
    let apiMessage = 'Northflank API was not tested because credentials are incomplete.';

    if (runtimeReady && projectId) {
      const results = await Promise.allSettled(
        services.map((service) => getNorthflankService(projectId, service.id)),
      );
      reachableServices = results.filter((result) => result.status === 'fulfilled').length;
      apiReachable = reachableServices === services.length;
      apiMessage = apiReachable
        ? `Northflank API authenticated successfully and all ${reachableServices} production services were resolved.`
        : `Northflank API responded, but only ${reachableServices}/${services.length} production services were resolved.`;
    }

    return buildCapabilityHealth('deployments', [
      {
        name: 'github-integration',
        passed: Boolean(
          process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
        ),
        required: true,
        message: 'GitHub deployment credentials checked.',
      },
      {
        name: 'northflank-token',
        passed: tokenPresent,
        required: true,
        message: tokenPresent ? 'Northflank token is configured.' : 'Northflank token is missing.',
      },
      {
        name: 'northflank-project',
        passed: projectPresent,
        required: true,
        message: projectPresent ? 'Northflank project is configured.' : 'Northflank project ID is missing.',
      },
      {
        name: 'northflank-services',
        passed: configuredServices.length >= 3,
        required: true,
        message: `${configuredServices.length} deployment services configured.`,
      },
      {
        name: 'northflank-runtime',
        passed: runtimeReady,
        required: true,
        message: runtimeReady ? 'Northflank runtime credentials are present.' : 'Northflank runtime is not ready.',
      },
      {
        name: 'northflank-live-api',
        passed: apiReachable,
        required: true,
        message: apiMessage,
      },
    ]);
  });
}
