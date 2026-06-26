/**
 * GET /api/devstudio/health
 *
 * Safe diagnostics for Dev Studio — boolean flags only, never secret values.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { hydrateProcessEnv } from '@/lib/secrets';
import { isGroqConfigured } from '@/lib/groq-client';
import { isGeminiConfigured } from '@/lib/gemini-client';
import { isOpenAIConfigured } from '@/lib/ai/openai-client';
import { isAnthropicConfigured } from '@/lib/ai/anthropic-client';
import { requireAdminClient } from '@/lib/supabase/admin';
import { probeStudioShell } from '@/lib/devstudio/shell-probe';
import { buildStudioRuntimeCompletion } from '@/lib/devstudio/studio-runtime';
import { getNorthflankProjectId, getNorthflankServices, isNorthflankReady } from '@/lib/northflank/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  await hydrateProcessEnv().catch(() => {});

  let dbGroq = false;
  let dbGemini = false;
  let dbOpenAI = false;
  let dbAnthropic = false;
  let dbGitHub = false;
  try {
    const db = await requireAdminClient();
    const { data } = await db
      .from('platform_secrets')
      .select('key, value_enc')
      .in('key', ['GROQ_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GITHUB_TOKEN']);
    for (const row of data ?? []) {
      const set = !!(row.value_enc && row.value_enc.length > 10);
      if (row.key === 'GROQ_API_KEY') dbGroq = set;
      if (row.key === 'GEMINI_API_KEY') dbGemini = set;
      if (row.key === 'OPENAI_API_KEY') dbOpenAI = set;
      if (row.key === 'ANTHROPIC_API_KEY') dbAnthropic = set;
      if (row.key === 'GITHUB_TOKEN') dbGitHub = set;
    }
  } catch {
    // non-fatal — fall back to process.env only
  }

  const shellWsUrl = process.env.STUDIO_SHELL_WS_URL ?? '';
  const shellSecret = process.env.STUDIO_SHELL_SECRET ?? '';
  const tokenSecret = process.env.STUDIO_TOKEN_SECRET ?? '';
  const shellWsPublic = process.env.STUDIO_SHELL_WS_URL_PUBLIC ?? '';
  const shellProbe = await probeStudioShell(shellWsUrl);

  const adminConfigured = !!(shellWsUrl && shellSecret && tokenSecret);
  const shell = {
    STUDIO_SHELL_WS_URL: shellWsUrl ? 'configured' : 'MISSING',
    STUDIO_SHELL_SECRET: shellSecret ? 'configured' : 'MISSING',
    STUDIO_TOKEN_SECRET: tokenSecret ? 'configured' : 'MISSING',
    STUDIO_SHELL_WS_URL_PUBLIC: shellWsPublic ? 'configured' : 'MISSING',
    configured: adminConfigured,
    ready: adminConfigured && shellProbe.ready,
    probe: shellProbe,
  };

  const hasGroq = isGroqConfigured() || dbGroq;
  const hasGemini = isGeminiConfigured() || dbGemini;
  const hasOpenAI = isOpenAIConfigured() || dbOpenAI;
  const hasAnthropic = isAnthropicConfigured() || dbAnthropic;
  const hasGitHub = !!process.env.GITHUB_TOKEN || !!process.env.GH_TOKEN || !!process.env.GITHUB_PAT || dbGitHub;
  const aiConfigured = hasGroq || hasGemini || hasOpenAI || hasAnthropic;
  const northflankProjectIdPresent = !!getNorthflankProjectId();
  const northflankTokenPresent = !!(process.env.NORTHFLANK_API_TOKEN || process.env.NORTHFLANK_API_KEY || process.env.NF_API_TOKEN);
  const northflankServices = getNorthflankServices().map((service) => ({
    key: service.key,
    id: service.id,
    configured: !!service.id,
  }));

  const studioRuntime = buildStudioRuntimeCompletion({
    adminConfigured,
    probe: shellProbe,
    hasGitHubToken: hasGitHub,
    aiConfigured,
  });

  const supabaseUrlPresent = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const supabaseServiceKeyPresent = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const nodeVersion = process.version;
  let nextVersion = 'unknown';
  try { nextVersion = require('next/package.json').version; } catch { /* noop */ }

  return NextResponse.json({
    hasGroq,
    hasGemini,
    hasOpenAI,
    hasAnthropic,
    hasGitHub,
    aiConfigured,
    supabaseUrlPresent,
    supabaseServiceKeyPresent,
    nodeVersion,
    nextVersion,
    availableProviders: {
      groq: hasGroq,
      gemini: hasGemini,
      openai: hasOpenAI,
      anthropic: hasAnthropic,
    },
    git: {
      endpoint: '/api/devstudio/git',
      remoteUrlPresent: !!(process.env.GITHUB_REMOTE_URL || process.env.GITHUB_REPO),
      tokenPresent: hasGitHub,
      pushScript: 'pnpm run git:push-main',
    },
    northflank: {
      ready: isNorthflankReady(),
      tokenPresent: northflankTokenPresent,
      projectIdPresent: northflankProjectIdPresent,
      services: northflankServices,
    },
    shell,
    studioRuntime,
    runtime: 'nodejs',
    service: 'admin',
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
  });
}
