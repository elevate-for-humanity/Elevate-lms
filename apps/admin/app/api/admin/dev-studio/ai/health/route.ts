import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(
    request,
    async () => {
      const hasGroq = Boolean(process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY);
      const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      const hasOpenAI = Boolean(process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY);
      const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY);
      const aiConfigured = hasGroq || hasGemini || hasOpenAI || hasAnthropic;

      return buildCapabilityHealth('ai', [
        { name: 'ai-provider-configured', passed: aiConfigured, required: true, message: aiConfigured ? 'At least one AI provider is configured.' : 'No AI provider keys are configured.' },
        { name: 'groq', passed: hasGroq, required: false, message: hasGroq ? 'Groq is configured.' : 'Groq is not configured.' },
        { name: 'gemini', passed: hasGemini, required: false, message: hasGemini ? 'Gemini is configured.' : 'Gemini is not configured.' },
        { name: 'openai', passed: hasOpenAI, required: false, message: hasOpenAI ? 'OpenAI is configured.' : 'OpenAI is not configured.' },
        { name: 'anthropic', passed: hasAnthropic, required: false, message: hasAnthropic ? 'Anthropic is configured.' : 'Anthropic is not configured.' },
      ]);
    },
  );
}
