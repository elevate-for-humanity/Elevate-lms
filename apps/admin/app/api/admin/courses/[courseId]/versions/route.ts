/**
 * GET  /api/admin/courses/[courseId]/versions  — version history
 * POST /api/admin/courses/[courseId]/versions  — publish (snapshot + increment)
 * PUT  /api/admin/courses/[courseId]/versions  — rollback to { version: N }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import {
  publishCourse,
  rollbackCourse,
  listCourseVersions,
} from '@/lib/course-builder/program-versioning';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Enforce approval gate.
  const { data: course } = await db
    .from('courses')
    .select('review_status')
    .eq('id', courseId)
    .maybeSingle();

  if (course && course.review_status !== 'approved') {
    return safeError(
      `Course must be approved before publishing. Current status: '${course.review_status}'.`,
      409,
    );
  }

  const result = await publishCourse(db, courseId, auth.id);
  if (!result.ok) return safeError(result.error ?? 'Publish failed', 500);

  return NextResponse.json({ ok: true, version: result.version });
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
