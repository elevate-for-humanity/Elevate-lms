import type { NextRequest } from 'next/server';
import { POST as completeLesson } from '../../../../../lessons/[lessonId]/complete/route';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Preserve the legacy course-scoped URL while invoking the canonical,
 * authenticated completion handler in the same request context.
 * A server-to-server fetch to request.url can target an internal Cloud Run
 * origin and loses request context. The canonical handler owns all gates,
 * rate limiting, and audit logging.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const { lessonId } = await params;
  return completeLesson(request, { params: Promise.resolve({ lessonId }) });
}
