import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { probeStudioShell } from '@/lib/devstudio/shell-probe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const shellUrl = process.env.STUDIO_SHELL_WS_URL ?? '';
    const shellSecret = process.env.STUDIO_SHELL_SECRET ?? '';
    const tokenSecret = process.env.STUDIO_TOKEN_SECRET ?? '';
    const probe = shellUrl ? await probeStudioShell(shellUrl) : { ready: false, message: 'Shell URL is missing.' };

    return buildCapabilityHealth('containers', [
      { name: 'shell-url', passed: Boolean(shellUrl), required: true, message: shellUrl ? 'Studio shell URL is configured.' : 'STUDIO_SHELL_WS_URL is missing.' },
      { name: 'shell-secret', passed: Boolean(shellSecret), required: true, message: shellSecret ? 'Studio shell secret is configured.' : 'STUDIO_SHELL_SECRET is missing.' },
      { name: 'token-secret', passed: Boolean(tokenSecret), required: true, message: tokenSecret ? 'Studio token secret is configured.' : 'STUDIO_TOKEN_SECRET is missing.' },
      { name: 'shell-probe', passed: Boolean(probe.ready), required: true, message: probe.ready ? 'Studio shell probe succeeded.' : probe.message || 'Studio shell probe failed.' },
    ]);
  });
}
