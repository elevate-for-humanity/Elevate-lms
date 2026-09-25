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
import { getDecryptedPlatformSecret, hydrateNorthflankEnv } from '@/lib/secrets';
import { probeCloudflareWorkersAI, resolveAIRuntimeState } from '@/lib/ai/provider-runtime';

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
  const hasGitHub = Boolean(process.env.GITHUB_TOKEN);
  const keys = [
    'OPENHANDS_API_KEY',
    'GITHUB_TOKEN',
    'ELEVATE_LLM_URL',
    'ELEVATE_LLM_SECRET',
    'STUDIO_BROWSER_URL',
    'STUDIO_BROWSER_PUBLIC_URL',
    'STUDIO_BROWSER_SECRET',
  ] as const;
  const selectedSecrets = Object.fromEntries(
    await Promise.all(
      keys.map(async (key) => [key, await getDecryptedPlatformSecret(key).catch(() => undefined)]),
    ),
  ) as Record<(typeof keys)[number], string | undefined>;
  await hydrateNorthflankEnv().catch(() => undefined);
  const [ai, cloudflareProbe] = await Promise.all([
    resolveAIRuntimeState(),
    probeCloudflareWorkersAI(),
  ]);
  const { xai: hasXAI, groq: hasGroq, gemini: hasGemini, openai: hasOpenAI, anthropic: hasAnthropic } = ai.providers;
  const hasCloudflare = cloudflareProbe.reachable;
  const hasOpenHands = Boolean(selectedSecrets.OPENHANDS_API_KEY || process.env.OPENHANDS_API_KEY);
  const dbGitHub = Boolean(selectedSecrets.GITHUB_TOKEN);
  const elevateLlmUrl =
    selectedSecrets.ELEVATE_LLM_URL || process.env.ELEVATE_LLM_URL || '';
  const elevateLlmSecret =
    selectedSecrets.ELEVATE_LLM_SECRET || process.env.ELEVATE_LLM_SECRET || '';
  const hasElevateOwnedAI = Boolean(elevateLlmUrl && elevateLlmSecret);
  const studioBrowserUrl = (
    selectedSecrets.STUDIO_BROWSER_URL ||
    process.env.STUDIO_BROWSER_URL ||
    ''
  ).replace(/\/$/, '');
  const studioBrowserPublicUrl =
    selectedSecrets.STUDIO_BROWSER_PUBLIC_URL ||
    process.env.STUDIO_BROWSER_PUBLIC_URL ||
    '';
  const studioBrowserSecret =
    selectedSecrets.STUDIO_BROWSER_SECRET ||
    process.env.STUDIO_BROWSER_SECRET ||
    '';
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
    } catch (error) {
      browserDetail = `isolated Studio browser is unreachable: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  const hasAnyAI = ai.anyConfigured;
  const githubOk = hasGitHub || dbGitHub;

  const checks: Check[] = [];

  // ── Devcontainer mode ──────────────────────────────────────────────────────
  if (mode === 'github-only' && !githubOk) {
    checks.push({
      name: 'Devcontainer',
      status: 'fail',
      detail: 'github-only mode but GITHUB_TOKEN is missing',
    });
  } else if (mode === 'github-only') {
    checks.push({
      name: 'Devcontainer',
      status: 'ok',
      detail: 'mode: github-only — GitHub writes enabled',
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
      detail: `mode: auto — ${githubOk ? 'GitHub writes enabled' : 'local fallback (no GITHUB_TOKEN)'}`,
    });
  }

  // ── GitHub token ───────────────────────────────────────────────────────────
  checks.push({
    name: 'GitHub Token',
    status: githubOk ? 'ok' : 'warn',
    detail: githubOk
      ? 'configured — workflow dispatch and devcontainer writes available'
      : 'not configured — deploy buttons and devcontainer saves will fail',
  });

  checks.push({
    name: 'Elevate Owned AI',
    status: hasElevateOwnedAI ? 'ok' : 'fail',
    detail: hasElevateOwnedAI
      ? 'ELEVATE_LLM_URL and ELEVATE_LLM_SECRET configured — no-paid default inference available'
      : 'Elevate-owned AI is not configured; automatic Dev Studio reasoning cannot run without external providers',
  });

  checks.push({
    name: 'Internal Engineering',
    status: githubOk && hasElevateOwnedAI ? 'ok' : 'fail',
    detail:
      githubOk && hasElevateOwnedAI
        ? 'Elevate-owned branch/PR engineering path is available; OpenHands is optional'
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
    status: cloudflareProbe.reachable
      ? 'ok'
      : cloudflareProbe.configured
        ? 'fail'
        : 'warn',
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
  const hasR2 = Boolean(
    process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY && process.env.R2_BUCKET,
  );
  checks.push({
    name: 'Upload Storage',
    status: 'ok',
    detail: hasR2 ? 'R2/S3 configured' : 'Supabase Storage (default)',
  });

  // ── Deploy identity ────────────────────────────────────────────────────────
  const hasNorthflank = Boolean(
    process.env.NORTHFLANK_API_TOKEN && process.env.NORTHFLANK_PROJECT_ID,
  );
  const deployReady = hasNorthflank || githubOk;

  checks.push({
    name: 'Deploy Identity',
    status: deployReady ? 'ok' : 'warn',
    detail: deployReady
      ? githubOk
        ? 'GitHub Actions dispatch available'
        : 'Northflank API available'
      : 'no Northflank API token or GitHub token — deploy buttons will fail',
  });

  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;
  const okCount = checks.filter((c) => c.status === 'ok').length;

  return NextResponse.json({
    ok: failCount === 0 && hasElevateOwnedAI && browserReachable && githubOk,
    summary: { okCount, warnCount, failCount },
    checks,
    meta: {
      devcontainerMode: mode,
      nodeEnv: process.env.NODE_ENV ?? 'unknown',
      service: 'admin',
    },
    timestamp: new Date().toISOString(),
  });
}
