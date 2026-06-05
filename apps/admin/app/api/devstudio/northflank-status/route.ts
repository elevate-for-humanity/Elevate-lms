/**
 * GET /api/devstudio/northflank-status
 *
 * Northflank LMS + Admin service status for Dev Studio.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
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

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const projectId = getNorthflankProjectId();
  if (!projectId || !isNorthflankReady()) {
    return safeError('Northflank API credentials are not configured', 503);
  }

  try {
    const services = await Promise.all(
      getNorthflankServices().map(async (cfg) => {
        const service = await getNorthflankService(projectId, cfg.id);
        const status = statusOf(service);
        const deploymentStatus = service.deploymentStatus as
          | { lastTransitionTime?: string; updatedAt?: string }
          | undefined;

        return {
          name: cfg.id,
          status,
          runningCount: isHealthy(status) ? 1 : 0,
          desiredCount: 1,
          pendingCount: ['BUILDING', 'DEPLOYING', 'PENDING'].includes(status.toUpperCase()) ? 1 : 0,
          deployBranch: String(
            (service.vcsData as { projectBranch?: string } | undefined)?.projectBranch ?? 'main',
          ),
          lastDeployedAt: deploymentStatus?.lastTransitionTime ?? deploymentStatus?.updatedAt ?? null,
          healthy: isHealthy(status),
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
