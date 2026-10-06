/**
 * Orchestrates "Publish & Update Website" from the admin dashboard:
 * 1. Bust ISR/cache on the public LMS (via cron revalidate endpoint)
 * 2. Trigger Northflank builds for LMS + Admin (latest main image)
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { PUBLIC_REVALIDATE_PATHS } from '@/lib/public-revalidate-paths';
import { getGoogleServices, getGoogleService } from '@/lib/google/runtime';

export type GoogleDeployResult = { service:string; key:string; status:'managed'|'failed'; detail?:string };

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
  deploy: GoogleDeployResult[];
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

/** Google production deploys are GitHub-authoritative; Admin publish refreshes live services without invoking a second control plane. */
export async function triggerProductionDeploys(): Promise<GoogleDeployResult[]> {
  return Promise.all(getGoogleServices().map(async service => {
    try {
      const health=await getGoogleService(service);
      return health.healthy
        ? {service:service.id,key:service.key,status:'managed' as const}
        : {service:service.id,key:service.key,status:'failed' as const,detail:'Google service is not healthy'};
    } catch(err) {
      return {service:service.id,key:service.key,status:'failed' as const,detail:(err instanceof Error?err.message:String(err)).slice(0,200)};
    }
  }));
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

  const deployResults: GoogleDeployResult[] = deploy
    ? await triggerProductionDeploys()
    : [];

  const deployOk = deployResults.length === 0 || deployResults.every((r) => r.status === 'managed');
  const ok = (revalidate ? revalidateResult.ok : true) && deployOk;

  return {
    ok,
    timestamp: new Date().toISOString(),
    revalidate: revalidateResult,
    deploy: deployResults,
    liveSiteUrl: lmsOrigin(),
  };
}

export type PublishWebsiteStatus = { googleReady:boolean; liveSiteUrl:string; services:Array<{key:string;id:string;label:string;url:string;status:string|null;lastDeployedAt:string|null}>; revalidatePathCount:number; };

export async function getPublishWebsiteStatus(): Promise<PublishWebsiteStatus> {
  const services=await Promise.all(getGoogleServices().map(async cfg=>{
    try { const g=await getGoogleService(cfg); return {key:cfg.key,id:cfg.id,label:cfg.label,url:cfg.url,status:g.status,lastDeployedAt:null}; }
    catch { return {key:cfg.key,id:cfg.id,label:cfg.label,url:cfg.url,status:'unreachable',lastDeployedAt:null}; }
  }));
  return {googleReady:services.every(s=>s.status==='healthy'),liveSiteUrl:lmsOrigin(),services,revalidatePathCount:PUBLIC_REVALIDATE_PATHS.length};
}
