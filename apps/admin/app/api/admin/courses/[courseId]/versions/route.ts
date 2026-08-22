/**
 * GET /api/admin/courses/[courseId]/versions — version history
 * POST — retired; publication and immutable snapshotting are owned by the
 * canonical Course Builder root -> persisted publish service -> LMS course service.
 * PUT /api/admin/courses/[courseId]/versions — rollback to { version: N }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import { rollbackCourse, listCourseVersions } from '@/lib/course-builder/program-versioning';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rl = await applyRateLimit(request, 'api');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const versions = await listCourseVersions(db, courseId);
  return NextResponse.json({ ok: true, versions });
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'COURSE_BUILDER_ROOT_REQUIRED',
      message: 'Publish through /api/admin/course-builder with action publish-persisted.',
      endpoint: '/api/admin/course-builder',
      action: 'publish-persisted',
    },
    { status: 410 },
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const body = await request.json().catch(() => ({}));
  if (!body.version || typeof body.version !== 'number') {
    return safeError('version (number) required', 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const result = await rollbackCourse(db, courseId, body.version, auth.id);
  if (!result.ok) return safeError(result.error ?? 'Rollback failed', 500);

  return NextResponse.json({ ok: true, rolledBackTo: result.rolledBackTo });
}
