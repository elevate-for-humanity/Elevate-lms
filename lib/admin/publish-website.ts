/**
 * Orchestrates "Publish & Update Website" from the admin dashboard:
 * 1. Bust ISR/cache on the public LMS (via cron revalidate endpoint)
 * 2. Trigger Northflank builds for LMS + Admin (latest main image)
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { PUBLIC_REVALIDATE_PATHS } from '@/lib/public-revalidate-paths';
import { dispatchGoogleDeployment } from '@/lib/gcp/dispatch-production-workflow';

export type NorthflankDeployResult = {
  service: string;
  key: string;
  status: 'triggered' | 'failed';
  detail?: string;
};

export type RevalidateLmsResult = {
  ok: boolean;
  paths?: readonly string[];
  error?: string;
  status?: number;
};

type RevalidateResponse = { ok?: boolean; revalidated?: string[]; error?: string };

export type PublishWebsiteResult = {
  ok: boolean;
  timestamp: string;
  revalidate: RevalidateLmsResult;
  deploy: NorthflankDeployResult[];
  liveSiteUrl: string;
};

function lmsOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.elevateforhumanity.org'
  ).replace(/\/$/, '');
}

/** Call LMS cron revalidate endpoint (requires CRON_SECRET on admin + LMS). */
export async function revalidatePublicLmsSite(): Promise<RevalidateLmsResult> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return {
      ok: false,
      error: 'CRON_SECRET is not configured on admin — cache refresh skipped',
      paths: PUBLIC_REVALIDATE_PATHS,
    };
  }

  try {
    const res = await fetch(`${lmsOrigin()}/api/cron/revalidate-public`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'User-Agent': 'ElevateAdminPublish/1.0',
      },
      signal: AbortSignal.timeout(45_000),
    });

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text().catch(() => '');
    if (!res.ok || !contentType.toLowerCase().includes('application/json')) {
      return {
        ok: false,
        status: res.status,
        error: !contentType.toLowerCase().includes('application/json')
          ? `Cache endpoint returned ${contentType || 'an unknown content type'} instead of JSON`
          : text.slice(0, 200) || `Public-site revalidate HTTP ${res.status}`,
        paths: PUBLIC_REVALIDATE_PATHS,
      };
    }

    let json: RevalidateResponse;
    try {
      json = JSON.parse(text) as RevalidateResponse;
    } catch {
      return { ok: false, status: res.status, error: 'Cache endpoint returned invalid JSON', paths: PUBLIC_REVALIDATE_PATHS };
    }
    if (json.ok !== true || !Array.isArray(json.revalidated)) {
      return { ok: false, status: res.status, error: json.error || 'Cache endpoint rejected the refresh contract', paths: PUBLIC_REVALIDATE_PATHS };
    }
    return {
      ok: true,
      status: res.status,
      paths: json.revalidated,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[publish-website] LMS revalidate failed', undefined, { message });
    return { ok: false, error: message, paths: PUBLIC_REVALIDATE_PATHS };
  }
}

/** Public website publishing belongs exclusively to Google Marketing. */
export async function triggerProductionDeploys(): Promise<NorthflankDeployResult[]> {
  try {
    const result = await dispatchGoogleDeployment('marketing');
    return [{
      service: result.target,
      key: result.target,
      status: 'triggered',
      detail: 'Google Cloud Run workflow dispatched; exact live revision still requires verification',
    }];
  } catch (error) {
    return [{
      service: 'marketing',
      key: 'marketing',
      status: 'failed',
      detail: error instanceof Error ? error.message : 'Google Marketing dispatch failed',
    }];
  }
}

export type PublishWebsiteOptions = {
  revalidate?: boolean;
  deploy?: boolean;
};

export async function publishAndUpdateWebsite(
  options: PublishWebsiteOptions = {},
): Promise<PublishWebsiteResult> {
  const revalidate = options.revalidate !== false;
  const deploy = options.deploy !== false;

  const revalidateResult: RevalidateLmsResult = revalidate
    ? await revalidatePublicLmsSite()
    : { ok: true, paths: PUBLIC_REVALIDATE_PATHS, error: 'skipped' };

  const deployResults: NorthflankDeployResult[] = deploy
    ? await triggerProductionDeploys()
    : [];

  const deployOk = deployResults.length === 0 || deployResults.every((r) => r.status === 'triggered');
  const ok = (revalidate ? revalidateResult.ok : true) && deployOk;

  return {
    ok,
    timestamp: new Date().toISOString(),
    revalidate: revalidateResult,
    deploy: deployResults,
    liveSiteUrl: lmsOrigin(),
  };
}

export type PublishWebsiteStatus = {
  northflankReady: boolean;
  liveSiteUrl: string;
  services: Array<{
    key: string;
    id: string;
    label: string;
    url: string;
    status: string | null;
    lastDeployedAt: string | null;
  }>;
  revalidatePathCount: number;
};

export async function getPublishWebsiteStatus(): Promise<PublishWebsiteStatus> {
  const targets = [
    { key: 'marketing', id: 'elevate-marketing-migration', label: 'Marketing', url: 'https://elevate-marketing-migration-aabnh2y32a-uc.a.run.app' },
    { key: 'admin', id: 'elevate-admin-migration', label: 'Admin', url: 'https://elevate-admin-migration-aabnh2y32a-uc.a.run.app' },
    { key: 'lms', id: 'elevate-lms-migration', label: 'LMS', url: 'https://elevate-lms-migration-aabnh2y32a-uc.a.run.app' },
  ];
  const services = await Promise.all(targets.map(async (target) => {
    let status = 'unreachable';
    try {
      const response = await fetch(target.url + '/api/health', {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      const payload = await response.json().catch(() => null) as { healthy?: boolean } | null;
      status = response.ok && payload?.healthy === true
        ? 'healthy (revision not verified)'
        : 'unhealthy (HTTP ' + response.status + ')';
    } catch { /* Do not treat a failed probe as healthy. */ }
    return { ...target, status, lastDeployedAt: null };
  }));
  return {
    northflankReady: false,
    liveSiteUrl: lmsOrigin(),
    services,
    revalidatePathCount: PUBLIC_REVALIDATE_PATHS.length,
  };
}
