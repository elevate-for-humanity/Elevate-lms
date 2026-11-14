/**
 * Compatibility adapter for the historical incremental course generator.
 *
 * Complete and missing-course generation is owned by /api/admin/course-builder.
 * This route performs no AI generation and no canonical course/lesson writes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const url = new URL('/api/admin/course-builder', request.url);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const cookie = request.headers.get('cookie');
  const authorization = request.headers.get('authorization');
  if (cookie) headers.set('cookie', cookie);
  if (authorization) headers.set('authorization', authorization);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'repair', courseId }),
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  return NextResponse.json(
    {
      ...result,
      compatibility: true,
      authority: '/api/admin/course-builder',
      action: 'repair',
    },
    { status: response.status },
  );
}
