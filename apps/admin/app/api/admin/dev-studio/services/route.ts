import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { getDecryptedPlatformSecret } from '@/lib/secrets';
import { requireTypedConfirmation } from '@/lib/security/require-confirmation';
import {
  getGoogleService,
  getGoogleServices,
  type GoogleServiceSummary,
} from '@/lib/google/runtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const colors = { marketing: 'green', admin: 'purple', lms: 'blue', store: 'amber' } as const;
const services = getGoogleServices().map((service) => ({ ...service, color: colors[service.key] }));
const repository = 'elevate-for-humanity/Elevate-lms';

async function checkHealth(service: GoogleServiceSummary) {
  const start = Date.now();
  try {
    const health = await getGoogleService(service);
    return {
      ok: health.healthy,
      latencyMs: Date.now() - start,
      status: health.httpStatus,
      commit: health.commit,
    };
  } catch {
    return { ok: false, latencyMs: Date.now() - start, status: null, commit: null };
  }
}

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  const results = await Promise.all(
    services.map(async (cfg) => {
      const health = await checkHealth(cfg);
      return {
        ...cfg,
        serviceId: cfg.id,
        provider: 'google-cloud-run',
        deployment: null,
        health,
        running: health.ok ? true : null,
        healthy: health.ok,
      };
    }),
  );
  return NextResponse.json({
    services: results,
    cluster: 'Google Cloud Run',
    fetchedAt: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  const body = await request.json().catch(() => null);
  if (!body || !services.some((s) => s.key === body.service))
    return safeError('Unknown service', 400);
  if (!['build', 'deploy'].includes(body.action)) return safeError('Choose build or deploy', 400);
  const confirmation = requireTypedConfirmation(body.confirmation, 'deploy_autopilot');
  if (!confirmation.ok)
    return NextResponse.json(
      {
        error: 'Service operation requires typed confirmation.',
        requiredConfirmation: confirmation.required,
      },
      { status: 409 },
    );
  if (body.action === 'deploy' && !/^[a-f0-9]{40}$/.test(String(body.image_sha || '')))
    return safeError('A full commit SHA of a successfully uploaded image is required', 400);
  const token = await getDecryptedPlatformSecret('GITHUB_TOKEN');
  if (!token) return safeError('GitHub deployment credentials are not configured', 503);
  const workflow =
    body.action === 'build' ? 'build-google-migration-images.yml' : 'deploy-google-repaired.yml';
  const inputs =
    body.action === 'build'
      ? { component: body.service }
      : { component: body.service, image_sha: body.image_sha };
  try {
    // The deployment workflow verifies the image digest, regional capacity,
    // startup and dependency readiness. Never fall back to Northflank or a repo edit.
    const response = await fetch(
      'https://api.github.com/repos/' +
        repository +
        '/actions/workflows/' +
        workflow +
        '/dispatches',
      {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ ref: 'main', inputs }),
      },
    );
    if (!response.ok)
      return safeError(
        'Google workflow dispatch failed (GitHub HTTP ' + response.status + ')',
        502,
      );
    logger.info('[devstudio/services] Google workflow queued', {
      action: body.action,
      service: body.service,
      userId: auth.id,
    });
    return NextResponse.json(
      {
        ok: true,
        state: 'queued',
        action: body.action,
        service: body.service,
        workflowUrl: 'https://github.com/' + repository + '/actions/workflows/' + workflow,
        message:
          body.action === 'build'
            ? 'Image build queued. No runtime deployment requested.'
            : 'Google deployment queued. Completion requires workflow and live health verification.',
      },
      { status: 202 },
    );
  } catch (error) {
    return safeInternalError(error, 'Google workflow request failed');
  }
}
