/**
 * /api/devstudio/services
 *
 * Northflank service status and deploy controls for LMS and Admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';
import {
  getNorthflankProjectId,
  getNorthflankService,
  getNorthflankServices,
  isNorthflankReady,
  triggerNorthflankBuild,
} from '@/lib/northflank/runtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ServiceHealth = { ok: boolean; latencyMs: number; status: number | null };

function statusOf(service: Record<string, unknown>): string {
  const deploymentStatus = service.deploymentStatus as { status?: string } | undefined;
  return deploymentStatus?.status ?? (service.buildStatus as string | undefined) ?? 'unknown';
}

function isRunning(status: string): boolean {
  return ['COMPLETED', 'RUNNING', 'SUCCESS'].includes(status.toUpperCase());
}

async function checkHealth(url: string, path: string): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const res = await fetch(`${url}${path}`, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'ElevateDevStudio/1.0' },
    });
    return { ok: res.ok, latencyMs: Date.now() - start, status: res.status };
  } catch {
    return { ok: false, latencyMs: Date.now() - start, status: null };
  }
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  await hydrateProcessEnv().catch(() => {});

  const projectId = getNorthflankProjectId();
  const nfReady = isNorthflankReady();

  const services = await Promise.all(
    getNorthflankServices().map(async (cfg) => {
      const [nfResult, health] = await Promise.allSettled([
        nfReady && projectId ? getNorthflankService(projectId, cfg.id) : Promise.resolve(null),
        checkHealth(cfg.url, cfg.healthPath),
      ]);

      const nf = nfResult.status === 'fulfilled' ? nfResult.value : null;
      const status = nf ? statusOf(nf) : nfReady ? 'unavailable' : 'not_configured';
      const running = nf ? isRunning(status) : null;
      const healthy = health.status === 'fulfilled' ? health.value.ok : null;
      const lastDeployedAt =
        ((nf?.deploymentStatus as { lastTransitionTime?: string; updatedAt?: string } | undefined)?.lastTransitionTime ??
          (nf?.deploymentStatus as { updatedAt?: string } | undefined)?.updatedAt ??
          null);

      return {
        key: cfg.key,
        label: cfg.label,
        serviceId: cfg.id,
        northflankService: cfg.id,
        url: cfg.url,
        color: cfg.color,
        northflank: nf
          ? {
              runningCount: running ? 1 : 0,
              desiredCount: 1,
              status,
              lastDeployedAt,
              deployBranch: String(
                (nf.vcsData as { projectBranch?: string } | undefined)?.projectBranch ?? 'main',
              ),
            }
          : null,
        health: health.status === 'fulfilled' ? health.value : null,
        running,
        healthy,
        hasNorthflank: nfReady,
      };
    }),
  );

  return NextResponse.json({
    services,
    cluster: projectId ? `northflank:${projectId}` : 'northflank:not-configured',
    fetchedAt: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  await hydrateProcessEnv().catch(() => {});

  let body: { action: string; service: string };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { action, service: serviceKey } = body;
  const cfg = getNorthflankServices().find((service) => service.key === serviceKey);
  if (!cfg) return safeError(`Unknown service: ${serviceKey}`, 400);

  const projectId = getNorthflankProjectId();
  if (!projectId || !isNorthflankReady()) {
    return safeError('Northflank API credentials are not configured', 503);
  }

  if (action === 'start' || action === 'stop') {
    return safeError('Start/stop is managed in Northflank. Use deploy or restart from this dashboard.', 409);
  }

  if (action !== 'deploy' && action !== 'restart') {
    return safeError(`Unknown action: ${action}`, 400);
  }

  try {
    const build = await triggerNorthflankBuild(projectId, cfg.id);
    logger.info('[devstudio/services] northflank build triggered', {
      action,
      service: cfg.id,
      userId: auth.id,
    });
    return NextResponse.json({ ok: true, action, service: cfg.id, build });
  } catch (err) {
    logger.error('[devstudio/services] Northflank action failed', undefined, { action, serviceKey, err });
    return safeInternalError(err, 'Northflank service action failed');
  }
}
