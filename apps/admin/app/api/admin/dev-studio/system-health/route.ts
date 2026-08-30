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
import {
  getDecryptedPlatformSecret,
  hydrateNorthflankEnv,
} from '@/lib/secrets';
import { isGroqConfigured } from '@/lib/groq-client';
import { isGeminiConfigured } from '@/lib/gemini-client';

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

  const mode        = (process.env.DEVSTUDIO_DEVCONTAINER_MODE ?? 'auto').toLowerCase();
  const hasGitHub   = Boolean(process.env.GITHUB_TOKEN);
  const hasOpenAI   = Boolean(process.env.OPENAI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const keys = ['GROQ_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GITHUB_TOKEN'] as const;
  const selectedSecrets = Object.fromEntries(
    await Promise.all(keys.map(async (key) => [key, await getDecryptedPlatformSecret(key).catch(() => undefined)])),
  ) as Record<(typeof keys)[number], string | undefined>;
  await hydrateNorthflankEnv().catch(() => undefined);

  const hasGroq = isGroqConfigured() || Boolean(selectedSecrets.GROQ_API_KEY);
  const hasGemini = isGeminiConfigured() || Boolean(selectedSecrets.GEMINI_API_KEY);
  const dbOpenAI = Boolean(selectedSecrets.OPENAI_API_KEY);
  const dbAnthropic = Boolean(selectedSecrets.ANTHROPIC_API_KEY);
  const dbGitHub = Boolean(selectedSecrets.GITHUB_TOKEN);

  const hasAnyAI = hasGroq || hasGemini || hasOpenAI || dbOpenAI || hasAnthropic || dbAnthropic;
  const githubOk = hasGitHub || dbGitHub;

  const checks: Check[] = [];

  // ── Devcontainer mode ──────────────────────────────────────────────────────
  if (mode === 'github-only' && !githubOk) {
    checks.push({ name: 'Devcontainer', status: 'fail', detail: 'github-only mode but GITHUB_TOKEN is missing' });
  } else if (mode === 'github-only') {
    checks.push({ name: 'Devcontainer', status: 'ok', detail: 'mode: github-only — GitHub writes enabled' });
  } else if (mode === 'local-only') {
    checks.push({ name: 'Devcontainer', status: 'warn', detail: 'mode: local-only — changes not committed to GitHub' });
  } else {
    checks.push({ name: 'Devcontainer', status: 'ok', detail: `mode: auto — ${githubOk ? 'GitHub writes enabled' : 'local fallback (no GITHUB_TOKEN)'}` });
  }

  // ── GitHub token ───────────────────────────────────────────────────────────
  checks.push({
    name: 'GitHub Token',
    status: githubOk ? 'ok' : 'warn',
    detail: githubOk
      ? 'configured — workflow dispatch and devcontainer writes available'
      : 'not configured — deploy buttons and devcontainer saves will fail',
  });

  // ── AI providers ───────────────────────────────────────────────────────────
  const aiProviders = [
    hasGroq                        && 'Groq',
    hasGemini                      && 'Gemini',
    (hasOpenAI    || dbOpenAI)     && 'OpenAI',
    (hasAnthropic || dbAnthropic)  && 'Anthropic',
  ].filter(Boolean).join(', ');

  checks.push({
    name: 'AI Providers',
    status: hasAnyAI ? 'ok' : 'fail',
    detail: hasAnyAI
      ? `active: ${aiProviders}`
      : 'no AI provider keys configured — chat and code AI will not work',
  });

  // ── Upload storage ─────────────────────────────────────────────────────────
  const hasR2 = Boolean(process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY && process.env.R2_BUCKET);
  checks.push({
    name: 'Upload Storage',
    status: 'ok',
    detail: hasR2 ? 'R2/S3 configured' : 'Supabase Storage (default)',
  });

  // ── Deploy identity ────────────────────────────────────────────────────────
  const hasNorthflank = Boolean(process.env.NORTHFLANK_API_TOKEN && process.env.NORTHFLANK_PROJECT_ID);
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
  const okCount   = checks.filter((c) => c.status === 'ok').length;

  return NextResponse.json({
    ok: failCount === 0,
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
