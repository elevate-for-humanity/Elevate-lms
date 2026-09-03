/**
 * Compatibility adapter for the historical per-course video endpoint.
 *
 * Media generation authority lives behind /api/admin/course-builder. This route
 * intentionally performs no rendering and writes no course lesson media fields.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const body = await request.json().catch(() => ({}));
  const lessonId = typeof body.lessonId === 'string' && body.lessonId.trim()
    ? body.lessonId.trim()
    : null;
  const force = body.force === true;

  const url = new URL('/api/admin/course-builder', request.url);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const cookie = request.headers.get('cookie');
  const authorization = request.headers.get('authorization');
  if (cookie) headers.set('cookie', cookie);
  if (authorization) headers.set('authorization', authorization);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'queue-media',
      courseId,
      lessonId,
      force,
      onlyMissing: !force,
    }),
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json(result, { status: response.status });

  const queued = Number(result?.result?.queued ?? 0);
  const microclipsQueued = Number(result?.result?.microclipsQueued ?? 0);
  const failed = Number(result?.result?.failed ?? 0);
  return NextResponse.json({
    ok: failed === 0,
    status: 'queued',
    queued,
    microclipsQueued,
    failed,
    result: result.result ?? null,
    message: `Queued ${queued} lesson video${queued === 1 ? '' : 's'} and ${microclipsQueued} microclip${microclipsQueued === 1 ? '' : 's'} through canonical Course Builder media processing. Queued media is not counted as generated until persisted jobs complete with playable URLs.`,
  });
}
