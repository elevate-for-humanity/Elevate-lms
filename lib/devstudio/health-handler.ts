import 'server-only';

import { NextRequest, NextResponse } from 'next/server';

import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { getGoogleServices, isGoogleRuntimeReady, googleProjectId } from '@/lib/google/runtime';
import { getGitHubToken } from '@/lib/devstudio/github-token';
import { probeCloudflareWorkersAI, resolveAIRuntimeState } from '@/lib/ai/provider-runtime';

/**
 * Canonical Admin-owned Dev Studio health implementation.
 *
 * Master Studio execution uses the Admin control plane and the Google Studio runtime. The legacy Studio Shell was removed and
 * is explicitly forbidden by scripts/verify-no-studio-shell.mjs, so health must
 * never require STUDIO_SHELL_* variables or advertise a separate shell service.
 */
export async function handleDevStudioHealth(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const [ai, cloudflareProbe] = await Promise.all([
    resolveAIRuntimeState().catch(() => ({
    providers: { groq: false, xai: false, gemini: false, openai: false, anthropic: false, cloudflare: false },
    activeProvider: 'none', elevate: false, anyConfigured: false,
    })),
    probeCloudflareWorkersAI().catch(() => ({
      configured: false,
      reachable: false,
      status: 'unreachable' as const,
      detail: 'Cloudflare Workers AI live probe failed.',
      checkedAt: new Date().toISOString(),
    })),
  ]);
  const { groq: hasGroq, xai: hasXAI, gemini: hasGemini, openai: hasOpenAI, anthropic: hasAnthropic } = ai.providers;
  const hasCloudflare = cloudflareProbe.reachable;
  const githubToken = await getGitHubToken();
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
  const activeProvider = ai.activeProvider;
  const hasElevate = ai.elevate;
  const aiConfigured = ai.anyConfigured;
  let nextVersion = 'unknown';
  try {
    nextVersion = require('next/package.json').version;
  } catch {
    nextVersion = 'unknown';
  }

  return NextResponse.json({
    hasGroq,
    hasXAI,
    hasGemini,
    hasOpenAI,
    hasAnthropic,
    hasElevate,
    hasCloudflare,
    cloudflare: cloudflareProbe,
    activeProvider,
    hasGitHub,
    githubTokenValid,
    aiConfigured,
    supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
    supabaseServiceKeyPresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    nodeVersion: process.version,
    nextVersion,
    availableProviders: {
      elevate: hasElevate,
      cloudflare: hasCloudflare,
      groq: hasGroq,
      xai: hasXAI,
      gemini: hasGemini,
      openai: hasOpenAI,
      anthropic: hasAnthropic,
    },
    git: {
      endpoint: '/api/admin/dev-studio/git',
      remoteUrlPresent: Boolean(process.env.GITHUB_REMOTE_URL || process.env.GITHUB_REPO),
      tokenPresent: hasGitHub,
      tokenValid: githubTokenValid,
      pushScript: 'pnpm run git:push-main',
    },
    execution: {
      mode: 'master-studio',
      ready: true,
      repositoryWritesReady: githubTokenValid,
      legacyShellRemoved: true,
    },
    google: {
      provider: 'google-cloud', ready: isGoogleRuntimeReady(), project: googleProjectId(),
      deploymentDispatchReady: githubTokenValid,
      services: getGoogleServices().map(({ key, id }) => ({ key, id })),
    },
    runtime: 'nodejs',
    service: 'admin',
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
  });
}
