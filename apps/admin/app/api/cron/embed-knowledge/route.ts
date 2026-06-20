import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/embed-knowledge
 *
 * Weekly cron: re-embeds platform knowledge into pgvector so RAG stays
 * current as the codebase evolves. Called by cron-scheduler.yml every Monday.
 *
 * Requires OPENAI_API_KEY — skips gracefully if absent.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    logger.warn('[embed-knowledge] OPENAI_API_KEY not set — skipping RAG re-embed');
    return NextResponse.json({ ok: true, skipped: true, reason: 'OPENAI_API_KEY not configured' });
  }

  try {
    const { embedPlatformKnowledge } = await import('@/lib/platform/rag-seeder');
    const result = await embedPlatformKnowledge({ source: 'all' });
    logger.info('[embed-knowledge] RAG re-embed complete', result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logger.error('[embed-knowledge] RAG re-embed failed', error as Error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
