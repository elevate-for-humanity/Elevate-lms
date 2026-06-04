/**
 * /api/devstudio/services
 *
 * Self-contained service management — no Gitpod dependency.
 * Combines legacy ECS status + local port health checks + service control.
 *
 * GET  → list all services with health, ports, URLs
 * POST { action: 'start'|'stop'|'restart', service: string }
 *      → scale legacy ECS service desired count up/down
 * POST { action: 'deploy', service: 'lms'|'admin' }
 *      → trigger GitHub Actions deploy workflow
 *
 * Admin-only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';
import { createHmac, createHash } from 'crypto';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REGION  = process.env.AWS_REGION ?? 'us-east-1';
const CLUSTER = 'elevate-cluster';

const SERVICES_CONFIG = [
  {
    key: 'lms',
    label: 'LMS (Main Site)',
    ecsService: 'elevate-lms-service',
    url: PLATFORM_DEFAULTS.siteUrl,
    healthPath: '/api/health',
    color: 'blue',
  },
  {
    key: 'admin',
    label: 'Admin Dashboard',
    ecsService: 'elevate-admin-service',
    url: 'https://admin.elevateforhumanity.org',
    healthPath: '/api/health',
    color: 'purple',
  },
  {
    key: 'studio',
    label: 'Dev Studio Shell',
    ecsService: 'elevate-studio-service',
    url: null,
    healthPath: null,
    color: 'green',
  },
] as const;

// ── SigV4 ─────────────────────────────────────────────────────────────────────

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}
function sha256hex(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}
function getSigningKey(secret: string, date: string, region: string, svc: string): Buffer {
  return hmac(hmac(hmac(hmac('AWS4' + secret, date), region), svc), 'aws4_request');
}

function signEcs(target: string, body: string) {
  const ak = process.env.AWS_ACCESS_KEY_ID!;
  const sk = process.env.AWS_SECRET_ACCESS_KEY!;
  const now = new Date();
  const amzDate   = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const host      = `ecs.${REGION}.amazonaws.com`;
  const ct        = 'application/x-amz-json-1.1';
  const ph        = sha256hex(body);
  const ch        = `content-type:${ct}\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:${target}\n`;
  const sh        = 'content-type;host;x-amz-date;x-amz-target';
  const cr        = ['POST', '/', '', ch, sh, ph].join('\n');
  const scope     = `${dateStamp}/${REGION}/ecs/aws4_request`;
  const sts       = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(cr)].join('\n');
  const sig       = createHmac('sha256', getSigningKey(sk, dateStamp, REGION, 'ecs')).update(sts).digest('hex');
  return {
    url: `https://${host}/`,
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${ak}/${scope}, SignedHeaders=${sh}, Signature=${sig}`,
      'x-amz-date': amzDate,
      'x-amz-target': target,
      'Content-Type': ct,
      host,
    },
  };
}

async function ecsPost(target: string, body: object): Promise<unknown> {
  const s = JSON.stringify(body);
  const { url, headers } = signEcs(target, s);
  const res = await fetch(url, { method: 'POST', headers, body: s });
  if (!res.ok) throw new Error(`ECS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// ── Health check ──────────────────────────────────────────────────────────────

async function checkHealth(url: string, path: string): Promise<{ ok: boolean; latencyMs: number; status: number | null }> {
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

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const hasAws = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

  // Fetch legacy ECS status + health checks in parallel
  const [ecsData, ...healthResults] = await Promise.allSettled([
    hasAws
      ? ecsPost('AmazonEC2ContainerServiceV20141113.DescribeServices', {
          cluster: CLUSTER,
          services: SERVICES_CONFIG.map(s => s.ecsService),
        })
      : Promise.resolve(null),
    ...SERVICES_CONFIG.map(s =>
      s.url && s.healthPath
        ? checkHealth(s.url, s.healthPath)
        : Promise.resolve(null),
    ),
  ]);

  const ecsServices: Record<string, { runningCount: number; desiredCount: number; status: string; lastDeployedAt: string | null; taskDefinition: string }> = {};
  if (ecsData.status === 'fulfilled' && ecsData.value) {
    const d = ecsData.value as { services?: Array<{ serviceName: string; status: string; runningCount: number; desiredCount: number; taskDefinition: string; deployments?: Array<{ status: string; updatedAt: string }> }> };
    for (const svc of d.services ?? []) {
      const primary = (svc.deployments ?? []).find(dep => dep.status === 'PRIMARY');
      ecsServices[svc.serviceName] = {
        runningCount: svc.runningCount,
        desiredCount: svc.desiredCount,
        status: svc.status,
        lastDeployedAt: primary?.updatedAt ?? null,
        taskDefinition: svc.taskDefinition?.split('/').pop() ?? '',
      };
    }
  }

  const services = SERVICES_CONFIG.map((cfg, i) => {
    const ecs = ecsServices[cfg.ecsService] ?? null;
    const health = healthResults[i].status === 'fulfilled' ? healthResults[i].value : null;

    const running = ecs ? ecs.runningCount > 0 : null;
    const healthy = health ? (health as { ok: boolean }).ok : null;

    return {
      key: cfg.key,
      label: cfg.label,
      ecsService: cfg.ecsService,
      url: cfg.url,
      color: cfg.color,
      ecs,
      health,
      running,
      healthy,
      hasAws,
    };
  });

  return NextResponse.json({ services, cluster: CLUSTER, fetchedAt: new Date().toISOString() });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: { action: string; service: string };
  try { body = await request.json(); } catch { return safeError('Invalid JSON', 400); }

  const { action, service: serviceKey } = body;
  const cfg = SERVICES_CONFIG.find(s => s.key === serviceKey);
  if (!cfg) return safeError(`Unknown service: ${serviceKey}`, 400);

  const hasAws = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

  try {
    if (action === 'start' || action === 'stop' || action === 'restart') {
      if (!hasAws) return safeError('AWS credentials not configured', 503);

      if (action === 'restart') {
        // Force new deployment
        await ecsPost('AmazonEC2ContainerServiceV20141113.UpdateService', {
          cluster: CLUSTER,
          service: cfg.ecsService,
          forceNewDeployment: true,
        });
        logger.info('[devstudio/services] restart', { service: cfg.ecsService });
        return NextResponse.json({ ok: true, action: 'restart', service: cfg.ecsService });
      }

      const desiredCount = action === 'start' ? 1 : 0;
      await ecsPost('AmazonEC2ContainerServiceV20141113.UpdateService', {
        cluster: CLUSTER,
        service: cfg.ecsService,
        desiredCount,
      });
      logger.info('[devstudio/services] scale', { service: cfg.ecsService, desiredCount });
      return NextResponse.json({ ok: true, action, service: cfg.ecsService, desiredCount });
    }

    if (action === 'deploy') {
      // Force-new-deployment picks up the latest image already in ECR
      // (built by the last GitHub Actions push). No rebuild needed.
      if (!hasAws) return safeError('AWS credentials not configured', 503);
      await ecsPost('AmazonEC2ContainerServiceV20141113.UpdateService', {
        cluster: CLUSTER,
        service: cfg.ecsService,
        forceNewDeployment: true,
      });
      logger.info('[devstudio/services] deploy (force-new-deployment)', { service: cfg.ecsService, userId: auth.id });
      return NextResponse.json({ ok: true, action: 'deploy', service: cfg.ecsService });
    }

    return safeError(`Unknown action: ${action}`, 400);
  } catch (err) {
    logger.error('[devstudio/services] POST failed', undefined, { action, serviceKey, err });
    return safeInternalError(err, 'Service action failed');
  }
}
