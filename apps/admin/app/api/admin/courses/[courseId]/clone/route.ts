/**
 * Compatibility endpoint for course cloning.
 *
 * Canonical course-package persistence is owned by lib/course-builder/clone-service.
 * This route retains the historical URL without owning direct course/module/lesson writes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { cloneCanonicalCourse } from '@/lib/course-builder/clone-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const result = await cloneCanonicalCourse({
      courseId,
      title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : undefined,
      slug: typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim() : undefined,
    });
    return NextResponse.json({ ok: true, course: result.course });
  } catch (error) {
    return safeInternalError(error, 'Failed to clone course');
  }
}
