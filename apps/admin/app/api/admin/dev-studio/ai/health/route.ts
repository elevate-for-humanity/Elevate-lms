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

    return buildCapabilityHealth('ai', [
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
