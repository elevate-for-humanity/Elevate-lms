import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  if (!isAIAvailable()) return safeError('No AI provider is configured.', 503);

  try {
    const result = await aiChat({
      messages: [{ role: 'user', content: 'Reply with exactly: "Elevate AI is working."' }],
      maxTokens: 20,
      temperature: 0,
    });

    return NextResponse.json({
      ok: true,
      response: result.content?.trim() ?? '',
    });
  } catch (err) {
    return safeInternalError(err, 'AI test failed');
  }
}
