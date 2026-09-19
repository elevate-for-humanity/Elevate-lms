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
] as const;

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
      present('CLOUDFLARE_AI_API_TOKEN', 'CLOUDFLARE_API_TOKEN'),
  };
  const activeProvider = getActiveProviderName();

  return {
    providers,
    activeProvider,
    elevate: activeProvider === 'elevate',
    anyConfigured: Object.values(providers).some(Boolean) || activeProvider === 'elevate',
  };
}
