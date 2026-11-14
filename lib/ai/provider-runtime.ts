import 'server-only';
import { probeOwnedModel } from '@/lib/ai/providers/owned-model-health.mjs';

import { getActiveProviderName } from '@/lib/ai/ai-service';
import { getSecrets, getSelectedRuntimeSecrets, hydrateProcessEnv } from '@/lib/secrets';

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

const HEALTH_SECRET_KEYS = [...PROVIDER_SECRET_KEYS, 'AI_PROVIDER', 'AI_PROVIDER_ORDER',
  'ELEVATE_LLM_URL', 'ELEVATE_LLM_SECRET', 'ELEVATE_LLM_CPU_URL', 'ELEVATE_LLM_CPU_SECRET',
  'ELEVATE_LLM_GPU_URL', 'ELEVATE_LLM_GPU_SECRET', 'ELEVATE_LLM_GOOGLE_IAM', 'ELEVATE_LLM_GPU_GOOGLE_IAM',
  'PARIS_GPU_ENABLED', 'PARIS_INFERENCE_TIER'] as const;
type HealthSecrets = Partial<Record<(typeof HEALTH_SECRET_KEYS)[number], string | undefined>>;
type HealthProbeOptions = { signal?: AbortSignal; secrets?: HealthSecrets | Promise<HealthSecrets>; ownedModelTimeoutMs?: number };

/** One scoped read supplies both independent AI probes without broad hydration. */
export function readAIHealthSecrets(signal?: AbortSignal) {
  return getSelectedRuntimeSecrets([...HEALTH_SECRET_KEYS], { signal });
}

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
export async function probeCloudflareWorkersAI(options: HealthProbeOptions = {}): Promise<CloudflareAIProbe> {
  if (!options.secrets) await hydrateProcessEnv();
  const secrets = options.secrets ? await options.secrets : await getSecrets([...PROVIDER_SECRET_KEYS]);
  options.signal?.throwIfAborted();
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
        redirect: 'error',
        signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
      },
    );
    if (response.ok) {
      const payload = await response.json().catch(() => null);
      const models = Array.isArray(payload?.result) ? payload.result : [];
      if (payload?.success !== true || !models.some((entry: {name?:string}) => entry?.name === model)) {
        return {configured:true,reachable:false,status:'unreachable',
          detail:'Cloudflare did not verify the configured Workers AI model.',checkedAt};
      }
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
  } catch {
    return {
      configured: true,
      reachable: false,
      status: 'unreachable',
      detail: 'Cloudflare Workers AI probe failed.',
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
export async function resolveAIRuntimeState(options: HealthProbeOptions = {}) {
  if (!options.secrets) await hydrateProcessEnv();
  const secrets = options.secrets ? await options.secrets : await getSecrets([...PROVIDER_SECRET_KEYS]);
  options.signal?.throwIfAborted();
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
  // getActiveProviderName may populate the inference discovery cache. A scoped
  // diagnostic must not select a provider or mutate that cache before hydration.
  const activeProvider = options.secrets ? 'not_tested' : getActiveProviderName();
  const snapshot = secrets as HealthSecrets;
  const selected = snapshot.AI_PROVIDER?.trim().toLowerCase() || snapshot.AI_PROVIDER_ORDER?.split(',')
    .map(name => name.trim().toLowerCase()).find(name => name && name !== 'none') || 'elevate';
  const configuredProvider = options.secrets
    ? ['elevate', 'gemini', 'google', 'groq', 'xai', 'cloudflare', 'openai', 'anthropic', 'azure', 'none'].includes(selected) ? selected : 'invalid'
    : activeProvider;
  const ownedModel = await probeOwnedModel({ env: { ...process.env, ...secrets }, signal: options.signal, timeoutMs: options.ownedModelTimeoutMs });

  return {
    providers,
    activeProvider,
    configuredProvider,
    ownedModel,
    elevate: ownedModel.verified,
    anyConfigured: Object.values(providers).some(Boolean) || (options.secrets ? ownedModel.configured === true : activeProvider === 'elevate'),
  };
}
