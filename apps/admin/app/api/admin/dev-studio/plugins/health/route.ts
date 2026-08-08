import { NextRequest } from 'next/server';
import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const githubConfigured = Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
    return buildCapabilityHealth('plugins', [
      {
        name: 'plugin-source-access',
        passed: githubConfigured,
        required: true,
        message: githubConfigured ? 'Plugin source access is configured.' : 'GitHub access for plugin sources is missing.',
      },
    ]);
  });
}
