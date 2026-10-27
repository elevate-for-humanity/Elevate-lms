import { NextRequest } from 'next/server';


import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { probeCloudflareWorkersAI, resolveAIRuntimeState } from '@/lib/ai/provider-runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const [{ providers, anyConfigured: aiConfigured, ownedModel }, cloudflare] = await Promise.all([
      resolveAIRuntimeState(),
      probeCloudflareWorkersAI(),
    ]);
    const { groq: hasGroq, xai: hasXAI, gemini: hasGemini, openai: hasOpenAI, anthropic: hasAnthropic } = providers;

    const ownedConfigured = ownedModel.configured;
    const ownedReady = ownedModel.verified;

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
        passed: ownedReady || aiConfigured,
        required: false,
        message: ownedReady ? 'Elevate-owned inference is verified.' : aiConfigured
          ? 'An external AI provider is configured; owned PARIS readiness is reported separately.'
          : 'No AI provider is verified or configured.',
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
