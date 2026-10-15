import { NextRequest } from 'next/server';


import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { probeCloudflareWorkersAI, resolveAIRuntimeState } from '@/lib/ai/provider-runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const [{ providers, anyConfigured: aiConfigured }, cloudflare] = await Promise.all([
      resolveAIRuntimeState(),
      probeCloudflareWorkersAI(),
    ]);
    const { groq: hasGroq, xai: hasXAI, gemini: hasGemini, openai: hasOpenAI, anthropic: hasAnthropic } = providers;

    const ownedUrl = process.env.ELEVATE_LLM_URL?.trim();
    const ownedSecret = process.env.ELEVATE_LLM_SECRET?.trim();
    const ownedConfigured = Boolean(ownedUrl && ownedSecret);
    let ownedReady = false;
    if (ownedConfigured) {
      try {
        const origin = new URL(ownedUrl!);
        if (origin.protocol === 'https:' && origin.hostname.endsWith('.run.app')) {
          const response = await fetch(`${origin.origin}/v1/models`, {
            headers: { Authorization: `Bearer ${ownedSecret}` },
            cache: 'no-store',
            signal: AbortSignal.timeout(5000),
          });
          if (response.ok) {
            const payload = await response.json().catch(() => ({}));
            ownedReady = Array.isArray(payload.data) &&
              payload.data.some((model: {id?: string}) => model.id === 'elevate-local');
          }
        }
      } catch { /* Report unavailable, never reveal the secret. */ }
    }

    return buildCapabilityHealth('ai', [
      {
        name: 'paris-owned-inference',
        passed: ownedReady,
        required: true,
        message: ownedReady ? 'PARIS private model responded to authenticated model discovery.'
          : ownedConfigured ? 'PARIS private model configured but not verified reachable.'
          : 'PARIS private model is not configured; GPU has not been activated.',
      },
      {
        name: 'ai-provider-configured',
        passed: aiConfigured,
        required: true,
        message: aiConfigured
          ? 'At least one AI provider is configured.'
          : 'No AI provider keys are configured.',
      },
      {
        name: 'xai',
        passed: hasXAI,
        required: false,
        message: hasXAI ? 'Grok / xAI is configured.' : 'Grok / xAI is not configured.',
      },
      {
        name: 'groq',
        passed: hasGroq,
        required: false,
        message: hasGroq ? 'Groq is configured.' : 'Groq is not configured.',
      },
      {
        name: 'gemini',
        passed: hasGemini,
        required: false,
        message: hasGemini ? 'Gemini is configured.' : 'Gemini is not configured.',
      },
      {
        name: 'openai',
        passed: hasOpenAI,
        required: false,
        message: hasOpenAI ? 'OpenAI is configured.' : 'OpenAI is not configured.',
      },
      {
        name: 'anthropic',
        passed: hasAnthropic,
        required: false,
        message: hasAnthropic ? 'Anthropic is configured.' : 'Anthropic is not configured.',
      },
      {
        name: 'cloudflare-workers-ai',
        passed: cloudflare.reachable,
        required: false,
        message: cloudflare.detail,
      },
    ]);
  });
}
