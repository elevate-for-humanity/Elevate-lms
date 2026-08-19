import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { getNorthflankProjectId, isNorthflankReady } from '@/lib/northflank/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const tokenPresent = Boolean(
      process.env.NORTHFLANK_API_TOKEN ||
        process.env.NORTHFLANK_API_KEY ||
        process.env.NF_API_TOKEN,
    );
    const projectPresent = Boolean(getNorthflankProjectId());

    return buildCapabilityHealth('containers', [
      {
        name: 'northflank-api',
        passed: tokenPresent,
        required: true,
        message: tokenPresent
          ? 'Northflank API token is configured.'
          : 'NORTHFLANK_API_TOKEN is missing.',
      },
      {
        name: 'northflank-project',
        passed: projectPresent,
        required: true,
        message: projectPresent
          ? 'Northflank project is configured.'
          : 'NORTHFLANK_PROJECT_ID is missing.',
      },
      {
        name: 'northflank-runtime',
        passed: isNorthflankReady(),
        required: true,
        message: isNorthflankReady()
          ? 'Northflank runtime control is ready.'
          : 'Northflank runtime control is not ready.',
      },
      {
        name: 'docker-registry',
        passed: Boolean(process.env.DOCKER_TOKEN),
        required: false,
        message: 'Optional Docker registry configuration checked.',
      },
    ]);
  });
}
