/**
 * Orchestrates "Publish & Update Website" from the admin dashboard:
 * 1. Bust ISR/cache on the public LMS (via cron revalidate endpoint)
 * 2. Trigger Northflank builds for LMS + Admin (latest main image)
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { PUBLIC_REVALIDATE_PATHS } from '@/lib/public-revalidate-paths';
import {
  getNorthflankProjectId,
  getNorthflankService,
  getNorthflankServices,
  isNorthflankReady,
  triggerNorthflankBuild,
} from '@/lib/northflank/runtime';

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

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        ok: false,
        status: res.status,
        error: text.slice(0, 200) || `LMS revalidate HTTP ${res.status}`,
        paths: PUBLIC_REVALIDATE_PATHS,
      };
    }

    const json = (await res.json().catch(() => ({}))) as { revalidated?: string[] };
    return {
      ok: true,
      status: res.status,
      paths: json.revalidated ?? PUBLIC_REVALIDATE_PATHS,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[publish-website] LMS revalidate failed', undefined, { message });
    return { ok: false, error: message, paths: PUBLIC_REVALIDATE_PATHS };
  }
}

/** Trigger Northflank builds for all production services. */
export async function triggerProductionDeploys(): Promise<NorthflankDeployResult[]> {
  const projectId = getNorthflankProjectId();
  if (!projectId || !isNorthflankReady()) {
    return getNorthflankServices().map((s) => ({
      service: s.id,
      key: s.key,
      status: 'failed' as const,
      detail: 'Northflank API credentials are not configured',
    }));
  }

  return Promise.all(
    getNorthflankServices().map(async (service) => {
      try {
        await triggerNorthflankBuild(projectId, service.id);
        return { service: service.id, key: service.key, status: 'triggered' as const };
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        return {
          service: service.id,
          key: service.key,
          status: 'failed' as const,
          detail: detail.slice(0, 200),
        };
      }
    }),
  );
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
  const projectId = getNorthflankProjectId();
  const nfReady = isNorthflankReady();

  const services = await Promise.all(
    getNorthflankServices().map(async (cfg) => {
      let status: string | null = null;
      let lastDeployedAt: string | null = null;

      if (nfReady && projectId) {
        try {
          const nf = await getNorthflankService(projectId, cfg.id);
          const deploymentStatus = nf.deploymentStatus as
            | { status?: string; lastTransitionTime?: string; updatedAt?: string }
            | undefined;
          status =
            deploymentStatus?.status ??
            (nf.buildStatus as string | undefined) ??
            'unknown';
          lastDeployedAt =
            deploymentStatus?.lastTransitionTime ?? deploymentStatus?.updatedAt ?? null;
        } catch {
          status = 'unavailable';
        }
      }

      return {
        key: cfg.key,
        id: cfg.id,
        label: cfg.label,
        url: cfg.url,
        status,
        lastDeployedAt,
      };
    }),
  );

  return {
    northflankReady: nfReady,
    liveSiteUrl: lmsOrigin(),
    services,
    revalidatePathCount: PUBLIC_REVALIDATE_PATHS.length,
  };
}
