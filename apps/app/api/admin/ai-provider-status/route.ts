/**
 * GET /api/admin/ai-provider-status
 *
 * Returns which AI provider keys are visible at runtime after hydrateProcessEnv().
 * Values are masked — only presence and first/last 4 chars shown.
 * Admin-only. Use this to diagnose "No AI provider available" errors.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function maskKey(val: string | undefined): string {
  if (!val) return '(not set)';
  if (val.length <= 8) return '****';
  return `${val.slice(0, 4)}…${val.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  // Hydrate — this is what the devstudio and ai-assistant routes do
  await hydrateProcessEnv();

  const groq   = process.env.GROQ_API_KEY;
  const gemini = process.env.GEMINI_API_KEY;
  const openai = process.env.OPENAI_API_KEY;

  const activeProvider =
    groq   ? 'groq'   :
    gemini ? 'gemini' :
    openai ? 'openai' :
    null;

  return NextResponse.json({
    activeProvider,
    keys: {
      GROQ_API_KEY:   { set: Boolean(groq),   masked: maskKey(groq) },
      GEMINI_API_KEY: { set: Boolean(gemini), masked: maskKey(gemini) },
      OPENAI_API_KEY: { set: Boolean(openai), masked: maskKey(openai) },
    },
    note: 'Values are loaded from platform_secrets → app_secrets → process.env (in that order)',
  });
}
