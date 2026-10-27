/**
 * GET /api/admin/dev-studio/system-health
 *
 * Unified readiness report for Dev Studio. Returns plain-English ok/warn/fail
 * checks covering: devcontainer mode, GitHub token, AI providers, upload path,
 * and deploy identity. Admin-only. Never returns secret values.
 *
 * Reads AI provider keys from both process.env and platform_secrets table so
 * keys saved via the Secrets panel are reflected immediately (same as /api/admin/dev-studio/health).
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getDecryptedPlatformSecret } from '@/lib/secrets';
import { probeCloudflareWorkersAI, resolveAIRuntimeState } from '@/lib/ai/provider-runtime';
import { getGitHubToken } from '@/lib/devstudio/github-token';
import { isGoogleDeploymentConfigured } from '@/lib/gcp/dispatch-production-workflow';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type CheckStatus = 'ok' | 'warn' | 'fail';

interface Check {
  name: string;
  status: CheckStatus;
  detail: string;
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const mode = (process.env.DEVSTUDIO_DEVCONTAINER_MODE ?? 'auto').toLowerCase();
  const keys = [
    'OPENHANDS_API_KEY',
    'STUDIO_BROWSER_URL',
    'STUDIO_BROWSER_PUBLIC_URL',
    'STUDIO_BROWSER_SECRET',
  ] as const;
  const selectedSecrets = Object.fromEntries(
    await Promise.all(
      keys.map(async (key) => [key, await getDecryptedPlatformSecret(key).catch(() => undefined)]),
    ),
  ) as Record<(typeof keys)[number], string | undefined>;
  const [ai, cloudflareProbe, googleReachable, githubProbe] = await Promise.all([
    resolveAIRuntimeState(),
    probeCloudflareWorkersAI(),
    isGoogleDeploymentConfigured(),
    (async () => {
      try {
        const token = await getGitHubToken();
        if (!token) return {ok:false, detail:'GitHub authentication is not configured'};
        const response = await fetch('https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/ref/heads/main', {
          headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},
          redirect:'error',cache:'no-store',signal:AbortSignal.timeout(8000),
        });
        if (!response.ok) return {ok:false,detail:`GitHub repository probe failed (HTTP ${response.status})`};
        const ref = await response.json();
        return /^[a-f0-9]{40}$/.test(ref.object?.sha ?? '')
          ? {ok:true,detail:'Repository main ref verified; write and dispatch authority require an actual operation'}
          : {ok:false,detail:'GitHub repository probe returned an invalid main ref'};
      } catch { return {ok:false,detail:'GitHub authentication or repository probe unavailable'}; }
    })(),
  ]);
  const {
    xai: hasXAI,
    groq: hasGroq,
    gemini: hasGemini,
    openai: hasOpenAI,
    anthropic: hasAnthropic,
  } = ai.providers;
  const hasCloudflare = cloudflareProbe.reachable;
  const hasOpenHands = Boolean(selectedSecrets.OPENHANDS_API_KEY || process.env.OPENHANDS_API_KEY);
  const hasElevateOwnedAI = ai.elevate;
  const studioBrowserUrl = (
    selectedSecrets.STUDIO_BROWSER_URL ||
    process.env.STUDIO_BROWSER_URL ||
    ''
  ).replace(/\/$/, '');
  const studioBrowserPublicUrl =
    selectedSecrets.STUDIO_BROWSER_PUBLIC_URL || process.env.STUDIO_BROWSER_PUBLIC_URL || '';
  const studioBrowserSecret =
    selectedSecrets.STUDIO_BROWSER_SECRET || process.env.STUDIO_BROWSER_SECRET || '';
  const browserConfigured = Boolean(
    studioBrowserUrl && studioBrowserPublicUrl && studioBrowserSecret,
  );
  let browserReachable = false;
  let browserDetail = browserConfigured
    ? 'configured but not yet probed'
    : 'STUDIO_BROWSER_URL, STUDIO_BROWSER_PUBLIC_URL, or STUDIO_BROWSER_SECRET is missing';
  if (browserConfigured) {
    try {
      const browserResponse = await fetch(`${studioBrowserUrl}/health`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8_000),
      });
      browserReachable = browserResponse.ok;
      browserDetail = browserResponse.ok
        ? 'isolated Studio browser runtime is reachable'
        : `isolated Studio browser returned HTTP ${browserResponse.status}`;
    } catch {
      browserDetail = 'isolated Studio browser is unreachable';
    }
  }

  const hasAnyAI = ai.anyConfigured;
  const githubOk = githubProbe.ok;

  const checks: Check[] = [];

  // ── Devcontainer mode ──────────────────────────────────────────────────────
  if (mode === 'github-only' && !githubOk) {
    checks.push({
      name: 'Devcontainer',
      status: 'fail',
      detail: 'github-only mode but GitHub repository access was not verified',
    });
  } else if (mode === 'github-only') {
    checks.push({
      name: 'Devcontainer',
      status: 'ok',
      detail: 'mode: github-only — GitHub repository read access verified',
    });
  } else if (mode === 'local-only') {
    checks.push({
      name: 'Devcontainer',
      status: 'warn',
      detail: 'mode: local-only — changes not committed to GitHub',
    });
  } else {
    checks.push({
      name: 'Devcontainer',
      status: 'ok',
      detail: `mode: auto — ${githubOk ? 'GitHub repository read verified' : 'GitHub repository access unavailable'}`,
    });
  }

  // ── GitHub token ───────────────────────────────────────────────────────────
  checks.push({
    name: 'GitHub Authorization',
    status: githubOk ? 'ok' : 'warn',
    detail: githubProbe.detail,
  });

  checks.push({
    name: 'Elevate Owned AI',
    status: hasElevateOwnedAI ? 'ok' : 'fail',
    detail: hasElevateOwnedAI
      ? 'Selected Elevate-owned model responded to authenticated discovery; command results require independent verification'
      : 'Selected Elevate-owned model is unavailable or failed authenticated discovery; configured external inference remains separate',
  });

  checks.push({
    name: 'Internal Engineering',
    status: githubOk && hasElevateOwnedAI ? 'ok' : 'fail',
    detail:
      githubOk && hasElevateOwnedAI
        ? 'Elevate-owned inference discovery and repository reads passed; completed engineering requires independent execution evidence'
        : 'Internal engineering requires both Elevate-owned AI and GitHub authorization',
  });

  checks.push({
    name: 'Studio Browser Runtime',
    status: browserReachable ? 'ok' : browserConfigured ? 'fail' : 'fail',
    detail: browserDetail,
  });

  // ── AI providers ───────────────────────────────────────────────────────────
  const aiProviders = [
    hasXAI && 'Grok / xAI',
    hasGroq && 'Groq',
    hasGemini && 'Gemini',
    hasOpenAI && 'OpenAI',
    hasAnthropic && 'Anthropic',
    hasCloudflare && 'Cloudflare',
    ai.elevate && 'Elevate',
  ]
    .filter(Boolean)
    .join(', ');

  checks.push({
    name: 'AI Providers',
    status: hasAnyAI ? 'ok' : 'fail',
    detail: hasAnyAI
      ? `active: ${aiProviders}`
      : 'no AI provider keys configured — chat and code AI will not work',
  });

  checks.push({
    name: 'Cloudflare Workers AI',
    status: cloudflareProbe.reachable ? 'ok' : cloudflareProbe.configured ? 'fail' : 'warn',
    detail: cloudflareProbe.detail,
  });

  checks.push({
    name: 'OpenHands Engineering',
    status: hasOpenHands ? 'ok' : 'warn',
    detail: hasOpenHands
      ? 'authorized credential configured — governed engineering execution available'
      : 'authorization missing — governed engineering execution unavailable',
  });

  // ── Upload storage ─────────────────────────────────────────────────────────
  const hasObjectStorage = Boolean(
    (process.env.ELEVATE_MEDIA_ENDPOINT || process.env.S3_ENDPOINT || process.env.R2_ENDPOINT) &&
    (process.env.ELEVATE_MEDIA_ACCESS_KEY_ID ||
      process.env.S3_ACCESS_KEY_ID ||
      process.env.R2_ACCESS_KEY ||
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) &&
    (process.env.ELEVATE_MEDIA_SECRET_ACCESS_KEY ||
      process.env.S3_SECRET_ACCESS_KEY ||
      process.env.R2_SECRET_KEY ||
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) &&
    (process.env.ELEVATE_MEDIA_BUCKET ||
      process.env.S3_BUCKET ||
      process.env.R2_BUCKET ||
      process.env.CLOUDFLARE_R2_BUCKET_NAME),
  );
  checks.push({
    name: 'Upload Storage',
    status: 'ok',
    detail: hasObjectStorage
      ? `Elevate Media Storage configured (${process.env.ELEVATE_MEDIA_PROVIDER || 'auto-detected'})`
      : 'Supabase Storage (safe fallback)',
  });

  // ── Deploy identity ────────────────────────────────────────────────────────
  checks.push({
    name: 'Deploy Identity',
    status: googleReachable ? 'ok' : 'fail',
    detail: googleReachable
      ? 'Google deployment workflow is active and readable with the configured credential; dispatch permission is verified when requested'
      : 'Google deployment workflow is unreachable, inactive, or the configured GitHub credential was rejected',
  });

  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;
  const okCount = checks.filter((c) => c.status === 'ok').length;

  return NextResponse.json({
    ok: failCount === 0 && hasElevateOwnedAI && browserReachable && githubOk,
    summary: { okCount, warnCount, failCount },
    message: checks.filter((check) => check.status === 'fail').map((check) => `${check.name}: ${check.detail}`).join(' | ') || 'Studio checks completed. Review warnings before execution.',
    checks,
    meta: {
      devcontainerMode: mode,
      nodeEnv: process.env.NODE_ENV ?? 'unknown',
      service: 'admin',
    },
    timestamp: new Date().toISOString(),
  });
}
