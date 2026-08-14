import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { listCourseVersions, publishCourseVersion, rollbackCourseVersion } from '@/lib/course-factory/versioning';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PublishSchema = z.object({
  courseId: z.string().uuid(),
  label: z.string().trim().max(250).optional(),
});
const RollbackSchema = z.object({
  courseId: z.string().uuid(),
  version: z.number().int().positive(),
});

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const courseId = request.nextUrl.searchParams.get('courseId');
  if (!courseId) return safeError('courseId is required', 400);

  try {
    const db = await requireAdminClient();
    const versions = await listCourseVersions(db, courseId);
    return NextResponse.json({ ok: true, versions });
  } catch (error) {
    return safeInternalError(error, 'Failed to load course versions');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = PublishSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid publish request', 400);

  try {
    const db = await requireAdminClient();
    const result = await publishCourseVersion(db, parsed.data.courseId, auth.id, parsed.data.label);
    if (!result.ok) {
      return NextResponse.json(result, { status: result.blockers?.length ? 409 : 400 });
    }

    await logAdminAudit({
      action: AdminAction.COURSE_PUBLISHED,
      actorId: auth.id,
      entityType: 'courses',
      entityId: parsed.data.courseId,
      metadata: { version: result.version, source: 'course_builder_versions' },
      req: request,
    });

    return NextResponse.json(result);
  } catch (error) {
    return safeInternalError(error, 'Failed to publish course version');
  }
}

export async function PUT(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = RollbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid rollback request', 400);

  try {
    const db = await requireAdminClient();
    const result = await rollbackCourseVersion(db, parsed.data.courseId, parsed.data.version, auth.id);
    if (!result.ok) return NextResponse.json(result, { status: 409 });

    await logAdminAudit({
      action: AdminAction.COURSE_UNPUBLISHED,
      actorId: auth.id,
      entityType: 'courses',
      entityId: parsed.data.courseId,
      metadata: { rolledBackTo: parsed.data.version, source: 'course_builder_versions' },
      req: request,
    });

    return NextResponse.json(result);
  } catch (error) {
    return safeInternalError(error, 'Failed to roll back course version');
  }
}
