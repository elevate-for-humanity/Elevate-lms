import { NextRequest } from 'next/server';
import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { getGoogleServices, getGoogleService } from '@/lib/google/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const checks = await Promise.all(getGoogleServices().map(async service => {
      const status = await getGoogleService(service).catch(() => null);
      const passed = Boolean(status?.healthy && status?.ready);
      return { name: `google-${service.key}`, passed, required: true,
        message: passed ? `${service.label} is healthy and ready.` : `${service.label} did not confirm healthy and ready.` };
    }));
    return buildCapabilityHealth('containers', checks);
  });
}
