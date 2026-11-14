/**
 * GET  /api/admin/courses/[courseId]/lessons/[lessonId]/versions
 *   Returns version history for a lesson, newest first.
 *
 * POST /api/admin/courses/[courseId]/lessons/[lessonId]/versions
 *   Rolls back to a specific version.
 *   Body: { version: number }
 *   Returns: { ok, rolledBackTo }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { getVersionHistory, rollbackLesson } from '@/lib/course-builder/versioning';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const rl = await applyRateLimit(request, 'api');
  if (rl) return rl;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { lessonId } = await params;

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const versions = await getVersionHistory(db, lessonId);
  return NextResponse.json({ ok: true, versions });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { lessonId } = await params;
  const body = await request.json().catch(() => ({}));

  if (!body.version || typeof body.version !== 'number') {
    return safeError('version (number) required', 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const result = await rollbackLesson(db, lessonId, body.version, auth.id);
  if (!result.ok) return safeError(result.error ?? 'Rollback failed', 500);

  return NextResponse.json({ ok: true, rolledBackTo: result.rolledBackTo });
}
