/**
 * GET /api/devstudio/system-health
 *
 * Unified readiness report for Dev Studio. Returns plain-English ok/warn/fail
 * checks covering: devcontainer mode, GitHub token, AI providers, upload path,
 * and deploy identity. Admin-only. Never returns secret values.
 *
 * Reads AI provider keys from both process.env and platform_secrets table so
 * keys saved via the Secrets panel are reflected immediately (same as /api/devstudio/health).
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { refreshSecrets } from '@/lib/secrets';
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

  // Refresh secrets cache so recently-saved keys are visible
  await refreshSecrets().catch(() => {});

  const mode        = (process.env.DEVSTUDIO_DEVCONTAINER_MODE ?? 'auto').toLowerCase();
  const hasGitHub   = Boolean(process.env.GITHUB_TOKEN);
  const hasOpenAI   = Boolean(process.env.OPENAI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  let hasGroq       = isGroqConfigured();
  let hasGemini     = isGeminiConfigured();
  let dbOpenAI      = false;
  let dbAnthropic   = false;
  let dbGitHub      = false;

  // Also check platform_secrets table — keys saved via Secrets panel live there
  // and won't be in process.env until the next deploy.
  try {
    const db = await requireAdminClient();
    const { data } = await db
      .from('platform_secrets')
      .select('key, value_enc')
      .in('key', ['GROQ_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GITHUB_TOKEN']);
    for (const row of data ?? []) {
      const set = !!(row.value_enc && row.value_enc.length > 10);
      if (row.key === 'GROQ_API_KEY')      hasGroq     = hasGroq     || set;
      if (row.key === 'GEMINI_API_KEY')    hasGemini   = hasGemini   || set;
      if (row.key === 'OPENAI_API_KEY')    dbOpenAI    = set;
      if (row.key === 'ANTHROPIC_API_KEY') dbAnthropic = set;
      if (row.key === 'GITHUB_TOKEN')      dbGitHub    = set;
    }
  } catch { /* non-fatal */ }

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
