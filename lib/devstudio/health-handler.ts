import 'server-only';

import { NextRequest, NextResponse } from 'next/server';

import { isAnthropicConfigured } from '@/lib/ai/anthropic-client';
import { isOpenAIConfigured } from '@/lib/ai/openai-client';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { isGeminiConfigured } from '@/lib/gemini-client';
import { isGroqConfigured } from '@/lib/groq-client';
import {
  getNorthflankProjectId,
  getNorthflankServices,
  isNorthflankReady,
} from '@/lib/northflank/runtime';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';

/**
 * Canonical Admin-owned Dev Studio health implementation.
 *
 * Dev Studio execution is admin-native. The legacy Studio Shell was removed and
 * is explicitly forbidden by scripts/verify-no-studio-shell.mjs, so health must
 * never require STUDIO_SHELL_* variables or advertise a separate shell service.
 */
export async function handleDevStudioHealth(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  await hydrateProcessEnv().catch(() => undefined);

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
      .in('key', [
        'GROQ_API_KEY',
        'GEMINI_API_KEY',
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'GITHUB_TOKEN',
      ]);

    for (const row of data ?? []) {
      const set = Boolean(row.value_enc && row.value_enc.length > 10);
      if (row.key === 'GROQ_API_KEY') dbGroq = set;
      if (row.key === 'GEMINI_API_KEY') dbGemini = set;
      if (row.key === 'OPENAI_API_KEY') dbOpenAI = set;
      if (row.key === 'ANTHROPIC_API_KEY') dbAnthropic = set;
      if (row.key === 'GITHUB_TOKEN') dbGitHub = set;
    }
  } catch {
    dbGroq = false;
    dbGemini = false;
    dbOpenAI = false;
    dbAnthropic = false;
    dbGitHub = false;
  }

  const hasGroq = isGroqConfigured() || dbGroq;
  const hasGemini = isGeminiConfigured() || dbGemini;
  const hasOpenAI = isOpenAIConfigured() || dbOpenAI;
  const hasAnthropic = isAnthropicConfigured() || dbAnthropic;
  const hasGitHub = Boolean(
    process.env.GITHUB_TOKEN ||
      process.env.GH_TOKEN ||
      process.env.GITHUB_PAT ||
      dbGitHub,
  );
  const aiConfigured = hasGroq || hasGemini || hasOpenAI || hasAnthropic;
  const northflankServices = getNorthflankServices().map((service) => ({
    key: service.key,
    id: service.id,
    configured: Boolean(service.id),
  }));
  const northflankTokenPresent = Boolean(
    process.env.NORTHFLANK_API_TOKEN ||
      process.env.NORTHFLANK_API_KEY ||
      process.env.NF_API_TOKEN,
  );
  const northflankProjectIdPresent = Boolean(getNorthflankProjectId());

  let nextVersion = 'unknown';
  try {
    nextVersion = require('next/package.json').version;
  } catch {
    nextVersion = 'unknown';
  }

  return NextResponse.json({
    hasGroq,
    hasGemini,
    hasOpenAI,
    hasAnthropic,
    hasGitHub,
    aiConfigured,
    supabaseUrlPresent: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    ),
    supabaseServiceKeyPresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    nodeVersion: process.version,
    nextVersion,
    availableProviders: {
      groq: hasGroq,
      gemini: hasGemini,
      openai: hasOpenAI,
      anthropic: hasAnthropic,
    },
    git: {
      endpoint: '/api/admin/dev-studio/git',
      remoteUrlPresent: Boolean(
        process.env.GITHUB_REMOTE_URL || process.env.GITHUB_REPO,
      ),
      tokenPresent: hasGitHub,
      pushScript: 'pnpm run git:push-main',
    },
    execution: {
      mode: 'admin-native',
      ready: hasGitHub,
      legacyShellRemoved: true,
    },
    northflank: {
      ready: isNorthflankReady(),
      tokenPresent: northflankTokenPresent,
      projectIdPresent: northflankProjectIdPresent,
      services: northflankServices,
    },
    runtime: 'nodejs',
    service: 'admin',
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
  });
}
