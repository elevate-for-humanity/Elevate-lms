import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { processPendingPlatformEvents } from '@/lib/platform/orchestration/dispatcher';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function authorized(request: NextRequest, secret: string): boolean {
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const headerSecret = request.headers.get('x-cron-secret') || '';
  return (!!bearer && safeEqual(bearer, secret)) || (!!headerSecret && safeEqual(headerSecret, secret));
}

export async function POST(request: NextRequest) {
  try {
    await hydrateProcessEnv();
  } catch (error) {
    logger.error('[orchestration/process] secret hydration failed', error instanceof Error ? error : undefined);
  }

  const secret = process.env.CRON_SECRET || '';
  if (!secret || !authorized(request, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requested = Number(request.nextUrl.searchParams.get('limit') || '20');
  const limit = Number.isFinite(requested) ? Math.max(1, Math.min(Math.floor(requested), 100)) : 20;

  try {
    const result = await processPendingPlatformEvents(limit);
    return NextResponse.json(result, {
      status: result.failed > 0 ? 207 : 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    logger.error('[orchestration/process] batch failed', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Orchestration batch failed' }, { status: 500 });
  }
}
