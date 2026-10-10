import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GOOGLE_PROJECT = 'elegant-racer-299721';
const SERVICES = [
  { name: 'marketing', url: 'https://elevate-marketing-migration-aabnh2y32a-uc.a.run.app' },
  { name: 'admin', url: 'https://elevate-admin-migration-aabnh2y32a-uc.a.run.app' },
  { name: 'lms', url: 'https://elevate-lms-migration-aabnh2y32a-uc.a.run.app' },
] as const;

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const results = await Promise.all(SERVICES.map(async ({ name, url }) => {
      try {
        const response = await fetch(url + '/api/health', {
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        });
        const body = await response.json().catch(() => null) as { healthy?: boolean; commit?: string } | null;
        const passed = response.ok && body?.healthy === true;
        return {
          name: 'google-cloud-run-' + name,
          passed,
          required: true,
          message: passed
            ? GOOGLE_PROJECT + ': ' + name + ' health OK; exact revision and traffic require independent verification'
            : GOOGLE_PROJECT + ': ' + name + ' health failed (HTTP ' + response.status + ')',
        };
      } catch {
        return {
          name: 'google-cloud-run-' + name,
          passed: false,
          required: true,
          message: GOOGLE_PROJECT + ': ' + name + ' health unreachable',
        };
      }
    }));
    return buildCapabilityHealth('deployments', [
      {
        name: 'github-integration',
        passed: Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN),
        required: true,
        message: 'GitHub dispatch token checked (does not prove Cloud Run deployment)',
      },
      ...results,
    ]);
  });
}
