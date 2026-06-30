// GET /api/admin/ai-provider-status
// Returns which AI provider keys are configured and which is active.
// Used by the AI console to show provider badges and disable unconfigured options.

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROVIDERS = ['openai', 'groq', 'anthropic', 'gemini', 'azure'] as const;

const PROVIDER_ENV_KEYS: Record<string, string> = {
  openai:    'OPENAI_API_KEY',
  groq:      'GROQ_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini:    'GEMINI_API_KEY',
  azure:     'AZURE_OPENAI_API_KEY',
};

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const keys: Record<string, { set: boolean }> = {};
  let activeProvider: string | null = null;

  for (const provider of PROVIDERS) {
    const envKey = PROVIDER_ENV_KEYS[provider];
    const isSet = !!(process.env[envKey]?.trim());
    keys[provider] = { set: isSet };
    // First configured provider in priority order is "active"
    if (!activeProvider && isSet) {
      activeProvider = provider;
    }
  }

  return NextResponse.json({ activeProvider, keys });
}
