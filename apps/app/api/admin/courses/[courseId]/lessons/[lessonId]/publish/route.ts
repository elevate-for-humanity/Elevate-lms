/**
 * POST /api/admin/courses/[courseId]/lessons/[lessonId]/publish
 *
 * Publishes a lesson: snapshots current state into course_lesson_versions,
 * increments version counter, marks lesson as published.
 *
 * Body (optional): { change_summary?: string }
 * Returns: { ok, version, versionId }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { publishLesson } from '@/lib/course-builder/versioning';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const rl = await applyRateLimit(request, 'api');
  if (rl) return rl;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { lessonId } = await params;
  const body = await request.json().catch(() => ({}));

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const result = await publishLesson(db, lessonId, auth.id, body.change_summary);

  if (!result.ok) return safeError(result.error ?? 'Publish failed', 500);

  return NextResponse.json({ ok: true, version: result.version, versionId: result.versionId });
}
