import 'server-only';

import { NextRequest, NextResponse } from 'next/server';

import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { getGoogleServices, isGoogleRuntimeReady, googleProjectId } from '@/lib/google/runtime';
import { getGitHubToken } from '@/lib/devstudio/github-token';
import { probeCloudflareWorkersAI, resolveAIRuntimeState, readAIHealthSecrets } from '@/lib/ai/provider-runtime';
import { runHealthProbe, waitForHealthSignal, STUDIO_HEALTH_BUDGET_MS, STUDIO_HEALTH_SECRET_MS, STUDIO_HEALTH_MODEL_MS } from './health-probes.mjs';

/**
 * Canonical Admin-owned Dev Studio health implementation.
 *
 * Master Studio execution uses the Admin control plane and the Google Studio runtime. The legacy Studio Shell was removed and
 * is explicitly forbidden by scripts/verify-no-studio-shell.mjs, so health must
 * never require STUDIO_SHELL_* variables or advertise a separate shell service.
 */
let pendingSnapshot: Promise<Record<string, unknown>> | undefined;

async function probeGitHub(signal: AbortSignal) {
  let githubAuthError: string | null = null;
  const githubToken = await getGitHubToken({ signal }).catch((error: unknown) => {
    signal.throwIfAborted();
    const message = error instanceof Error ? error.message : '';
    const knownCode = /^GITHUB_(?:APP_[A-Z0-9_]+|TOKEN_REJECTED|CREDENTIAL_CHECK_UNAVAILABLE_HTTP_[0-9]{3})$/.test(message);
    githubAuthError = knownCode ? message : 'github_authentication_unavailable';
    return null;
  });
  let githubTokenValid = false;
  if (githubToken) {
    // Read the repository PARIS needs. A successful read is not write or dispatch evidence.
    const response = await fetch('https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/ref/heads/main', {
      headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json' },
      redirect: 'error', cache: 'no-store', signal,
    });
    githubTokenValid = response.ok;
  }
  return { hasGitHub: Boolean(githubToken), githubTokenValid, githubAuthError };
}

async function collectHealthSnapshot(): Promise<Record<string, unknown>> {
  const overall = new AbortController();
  const secretRead = new AbortController();
  const overallTimer = setTimeout(() => overall.abort(new DOMException('Health snapshot deadline exceeded', 'TimeoutError')), STUDIO_HEALTH_BUDGET_MS);
  const secretTimer = setTimeout(() => secretRead.abort(new DOMException('Health secret deadline exceeded', 'TimeoutError')), STUDIO_HEALTH_SECRET_MS);
  try {
    // Both AI checks share one scoped read; neither broad-hydrates the runtime
    // nor serializes the independent GitHub check behind a sleeping model.
    const secrets = readAIHealthSecrets(AbortSignal.any([overall.signal, secretRead.signal]));
    const [aiProbe, cloudflareResult, githubProbe] = await Promise.all([
      runHealthProbe(async signal => resolveAIRuntimeState({ signal, secrets: await waitForHealthSignal(secrets, signal), ownedModelTimeoutMs: STUDIO_HEALTH_MODEL_MS }), { signal: overall.signal }),
      runHealthProbe(async signal => probeCloudflareWorkersAI({ signal, secrets: await waitForHealthSignal(secrets, signal) }), { signal: overall.signal }),
      runHealthProbe(probeGitHub, { signal: overall.signal }),
    ]);
    const ai = aiProbe.value ?? {
      providers: { groq: false, xai: false, gemini: false, openai: false, anthropic: false, cloudflare: false },
      activeProvider: 'none', elevate: false, anyConfigured: false,
    };
    const cloudflareProbe = cloudflareResult.value ?? {
      configured: false, reachable: false, status: 'unavailable',
      detail: 'Cloudflare verification did not complete.', checkedAt: cloudflareResult.checkedAt,
    };
    const github = githubProbe.value ?? { hasGitHub: false, githubTokenValid: false, githubAuthError: null };
    const { groq: hasGroq, xai: hasXAI, gemini: hasGemini, openai: hasOpenAI, anthropic: hasAnthropic } = ai.providers;
    const hasCloudflare = cloudflareProbe.reachable;
    const { hasGitHub, githubTokenValid, githubAuthError } = github;
    const incomplete = [aiProbe, githubProbe].some(probe => probe.status !== 'completed');
    const activeProvider = ai.activeProvider;
    const hasElevate = ai.elevate;
    const aiConfigured = ai.anyConfigured;
    // Configuration alone does not establish successful browser or workflow execution.
    const executionPrerequisitesReady = githubTokenValid && isGoogleRuntimeReady() &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) && hasElevate;
    let nextVersion = 'unknown';
    try {
      nextVersion = require('next/package.json').version;
    } catch {
      nextVersion = 'unknown';
    }

    return {
      probes: Object.fromEntries(Object.entries({ ai: aiProbe, cloudflare: cloudflareResult, github: githubProbe }).map(([key, probe]) => [key, { status: probe.status, checkedAt: probe.checkedAt }])),
      hasGroq,
      hasXAI,
      hasGemini,
      hasOpenAI,
      hasAnthropic,
      hasElevate,
      ownedModel: 'ownedModel' in ai ? ai.ownedModel : { configured: false, verified: false, status: 'unavailable' },
      hasCloudflare,
      cloudflare: cloudflareProbe,
      activeProvider,
      configuredProvider: 'configuredProvider' in ai ? ai.configuredProvider : 'unknown',
      hasGitHub,
      githubTokenValid,
      githubAuthError,
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
        ready: executionPrerequisitesReady,
        verifiedEndToEnd: false,
        status: incomplete ? 'verification-incomplete' : executionPrerequisitesReady ? 'prerequisites-configured-not-tested' : 'missing-prerequisites',
        repositoryWritesReady: githubTokenValid ? null : false,
        legacyShellRemoved: true,
      },
      google: {
        provider: 'google-cloud', ready: isGoogleRuntimeReady(), project: googleProjectId(),
        deploymentDispatchReady: githubTokenValid ? null : false,
        services: getGoogleServices().map(({ key, id }) => ({ key, id })),
      },
      runtime: 'nodejs',
      service: 'admin',
      nodeEnv: process.env.NODE_ENV ?? 'unknown',
    };
  } finally {
    clearTimeout(overallTimer);
    clearTimeout(secretTimer);
    overall.abort();
    secretRead.abort();
  }
}

export async function handleDevStudioHealth(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  // Coalesce only active read-only verification, never authentication. Shared
  // work has its own bounded lifetime, independent of a refresh/disconnection.
  if (!pendingSnapshot) {
    const snapshot = collectHealthSnapshot();
    pendingSnapshot = snapshot;
    const clearPending = () => { if (pendingSnapshot === snapshot) pendingSnapshot = undefined; };
    void snapshot.then(clearPending, clearPending);
  }
  return NextResponse.json(await pendingSnapshot, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
  });
}
