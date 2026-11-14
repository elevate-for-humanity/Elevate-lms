import { NextResponse } from 'next/server';
import { CourseUpdateSchema } from '@/lib/validators/course';
import { getCourse, updateCourse, deleteCourse } from '@/lib/db/courses';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  try {
    const data = await getCourse(courseId);
    if (!data) return safeError('Course not found', 404);
    return NextResponse.json({ data });
  } catch (err) {
    return safeInternalError(err, 'Failed to load course');
  }
}

async function _PATCH(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  try {
    const body = await request.json().catch(() => null);
    const parsed = CourseUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = await updateCourse(courseId, parsed.data);
    if (!data) return safeError('Course not found', 404);
    return NextResponse.json({ data });
  } catch (err) {
    return safeInternalError(err, 'Failed to update course');
  }
}

async function _DELETE(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  try {
    await deleteCourse(courseId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to delete course');
  }
}

export const GET = withApiAudit('/api/admin/courses/[courseId]', _GET);
export const PATCH = withApiAudit('/api/admin/courses/[courseId]', _PATCH);
export const DELETE = withApiAudit('/api/admin/courses/[courseId]', _DELETE);
