/**
 * GET /api/admin/dev-studio/northflank-status
 *
 * Northflank LMS + Admin service status for Dev Studio.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { hydrateNorthflankEnv } from '@/lib/secrets';
import {
  getNorthflankProjectId,
  getNorthflankService,
  getNorthflankServices,
  isNorthflankReady,
} from '@/lib/northflank/runtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function statusOf(service: Record<string, unknown>): string {
  const deploymentStatus = service.deploymentStatus as { status?: string } | undefined;
  return deploymentStatus?.status ?? (service.buildStatus as string | undefined) ?? 'unknown';
}

function isHealthy(status: string): boolean {
  return ['COMPLETED', 'RUNNING', 'SUCCESS'].includes(status.toUpperCase());
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  // Canonical Northflank credentials are encrypted in platform_secrets. Read
  // only the two control-plane keys required by this endpoint before probing.
  await hydrateNorthflankEnv().catch(() => undefined);

  const projectId = getNorthflankProjectId();
  if (!projectId || !isNorthflankReady()) {
    return safeError('Northflank API credentials are not configured', 503);
  }

  try {
    const services = await Promise.all(
      getNorthflankServices().map(async (cfg) => {
        const [service, healthResponse] = await Promise.all([
          getNorthflankService(projectId, cfg.id),
          fetch(`${cfg.url}${cfg.healthPath}`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(5000),
            headers: { 'User-Agent': 'ElevateDevStudio/1.0' },
          }).catch(() => null),
        ]);
        const status = statusOf(service);
        const runtimeHealthy = isHealthy(status) || healthResponse?.ok === true;
        const deploymentStatus = service.deploymentStatus as
          | { lastTransitionTime?: string; updatedAt?: string }
          | undefined;

        return {
          name: cfg.id,
          status,
          runningCount: runtimeHealthy ? 1 : 0,
          desiredCount: 1,
          pendingCount: ['BUILDING', 'DEPLOYING', 'PENDING'].includes(status.toUpperCase()) ? 1 : 0,
          deployBranch: String(
            (service.vcsData as { projectBranch?: string } | undefined)?.projectBranch ?? 'main',
          ),
          lastDeployedAt: deploymentStatus?.lastTransitionTime ?? deploymentStatus?.updatedAt ?? null,
          healthy: runtimeHealthy,
          providerStatus: status,
          healthStatus: healthResponse?.status ?? null,
        };
      }),
    );

    return NextResponse.json({
      cluster: `northflank:${projectId}`,
      services,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch Northflank status');
  }
}
