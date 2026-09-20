import 'server-only';

import { getActiveProviderName } from '@/lib/ai/ai-service';
import { getSecrets, hydrateProcessEnv } from '@/lib/secrets';

const PROVIDER_SECRET_KEYS = [
  'GROQ_API_KEY',
  'XAI_API_KEY',
  'GROK_API_KEY',
  'XAI_API_TOKEN',
  'GROK_API_TOKEN',
  'GEMINI_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'CLAUDE_API_KEY',
  'ANTHROPIC_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_AI_API_TOKEN',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_AI_MODEL',
] as const;

export type CloudflareAIProbe = {
  configured: boolean;
  reachable: boolean;
  status: 'not_configured' | 'reachable' | 'authentication_failed' | 'unreachable';
  detail: string;
  checkedAt: string;
};

/**
 * Validate the exact Cloudflare account/token/model used by inference without
 * spending inference tokens. The model catalogue endpoint proves account scope
 * and authentication; checking strings alone produced false-green Studio UI.
 */
export async function probeCloudflareWorkersAI(): Promise<CloudflareAIProbe> {
  await hydrateProcessEnv();
  const secrets = await getSecrets([...PROVIDER_SECRET_KEYS]);
  const accountId = secrets.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = (
    secrets.CLOUDFLARE_AI_API_TOKEN || secrets.CLOUDFLARE_API_TOKEN
  )?.trim();
  const model = secrets.CLOUDFLARE_AI_MODEL?.trim();
  const checkedAt = new Date().toISOString();
  const configured = Boolean(accountId && token && model?.startsWith('@cf/'));

  if (!configured) {
    return {
      configured: false,
      reachable: false,
      status: 'not_configured',
      detail: 'Cloudflare account, AI token, or Workers AI model is missing.',
      checkedAt,
    };
  }

  try {
    const query = new URLSearchParams({ search: model!, per_page: '1' });
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search?${query}`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (response.ok) {
      return {
        configured: true,
        reachable: true,
        status: 'reachable',
        detail: `Cloudflare Workers AI authenticated for ${model}.`,
        checkedAt,
      };
    }
    return {
      configured: true,
      reachable: false,
      status: response.status === 401 || response.status === 403
        ? 'authentication_failed'
        : 'unreachable',
      detail: `Cloudflare Workers AI probe returned HTTP ${response.status}.`,
      checkedAt,
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      status: 'unreachable',
      detail: error instanceof Error
        ? `Cloudflare Workers AI probe failed: ${error.message}`
        : 'Cloudflare Workers AI probe failed.',
      checkedAt,
    };
  }
}

export type AIRuntimeState = Awaited<ReturnType<typeof resolveAIRuntimeState>>;

/**
 * Canonical, server-only provider readiness resolver.
 *
 * Provider health must reflect the same runtime secret precedence as inference:
 * encrypted platform_secrets first, legacy app_secrets second, deployment
 * variables last. Browser-exposed NEXT_PUBLIC variables are intentionally never
 * accepted as credentials.
 */
export async function resolveAIRuntimeState() {
  await hydrateProcessEnv();
  const secrets = await getSecrets([...PROVIDER_SECRET_KEYS]);
  const present = (...keys: (typeof PROVIDER_SECRET_KEYS)[number][]) =>
    keys.some((key) => Boolean(secrets[key]?.trim()));

  const providers = {
    xai: present('XAI_API_KEY', 'GROK_API_KEY', 'XAI_API_TOKEN', 'GROK_API_TOKEN'),
    groq: present('GROQ_API_KEY'),
    gemini: present('GEMINI_API_KEY'),
    openai: present('OPENAI_API_KEY'),
    anthropic: present('ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'ANTHROPIC_API_TOKEN'),
    cloudflare:
      present('CLOUDFLARE_ACCOUNT_ID') &&
      present('CLOUDFLARE_AI_API_TOKEN', 'CLOUDFLARE_API_TOKEN') &&
      present('CLOUDFLARE_AI_MODEL'),
  };
  const activeProvider = getActiveProviderName();

  return {
    providers,
    activeProvider,
    elevate: activeProvider === 'elevate',
    anyConfigured: Object.values(providers).some(Boolean) || activeProvider === 'elevate',
  };
}
