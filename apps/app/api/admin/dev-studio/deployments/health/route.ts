import { NextRequest } from 'next/server';


import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import {
  getNorthflankProjectId,
  getNorthflankServices,
  isNorthflankReady,
} from '@/lib/northflank/runtime';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  return capabilityHealthResponse(
    request,
    async () => {
      const tokenPresent = Boolean(
        process.env.NORTHFLANK_API_TOKEN ||
          process.env.NORTHFLANK_API_KEY ||
          process.env.NF_API_TOKEN,
      );


      const projectPresent = Boolean(
        getNorthflankProjectId(),
      );


      const services = getNorthflankServices();
      const configuredServices = services.filter(
        (service) => Boolean(service.id),
      );


      return buildCapabilityHealth('deployments', [
        {
          name: 'northflank-token',
          passed: tokenPresent,
          required: true,
          message: tokenPresent
            ? 'Northflank token is configured.'
            : 'Northflank token is missing.',
        },
        {
          name: 'northflank-project',
          passed: projectPresent,
          required: true,
          message: projectPresent
            ? 'Northflank project is configured.'
            : 'Northflank project ID is missing.',
        },
        {
          name: 'northflank-services',
          passed: configuredServices.length >= 3,
          required: true,
          message:
            `${configuredServices.length} deployment services configured.`,
        },
        {
          name: 'northflank-runtime',
          passed: isNorthflankReady(),
          required: true,
          message: isNorthflankReady()
            ? 'Northflank runtime reports ready.'
            : 'Northflank runtime is not ready.',
        },
      ]);
    },
  );
}
