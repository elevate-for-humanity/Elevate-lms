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
import {
  getDecryptedPlatformSecret,
  hydrateNorthflankEnv,
} from '@/lib/secrets';

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

  const requestedKeys = [
    'GROQ_API_KEY',
    'GEMINI_API_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GITHUB_TOKEN',
  ] as const;
  const selectedSecrets = Object.fromEntries(
    await Promise.all(
      requestedKeys.map(async (key) => [
        key,
        await getDecryptedPlatformSecret(key).catch(() => undefined),
      ]),
    ),
  ) as Record<(typeof requestedKeys)[number], string | undefined>;
  await hydrateNorthflankEnv().catch(() => undefined);

  const hasGroq = isGroqConfigured() || Boolean(selectedSecrets.GROQ_API_KEY);
  const hasGemini = isGeminiConfigured() || Boolean(selectedSecrets.GEMINI_API_KEY);
  const hasOpenAI = isOpenAIConfigured() || Boolean(selectedSecrets.OPENAI_API_KEY);
  const hasAnthropic = isAnthropicConfigured() || Boolean(selectedSecrets.ANTHROPIC_API_KEY);
  const githubToken = process.env.GITHUB_TOKEN ||
      process.env.GH_TOKEN ||
      process.env.GITHUB_PAT ||
      selectedSecrets.GITHUB_TOKEN;
  const hasGitHub = Boolean(githubToken);
  let githubTokenValid = false;
  if (githubToken) {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      githubTokenValid = response.ok;
    } catch {
      githubTokenValid = false;
    }
  }
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
    githubTokenValid,
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
      tokenValid: githubTokenValid,
      pushScript: 'pnpm run git:push-main',
    },
    execution: {
      mode: 'admin-native',
      ready: githubTokenValid,
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
