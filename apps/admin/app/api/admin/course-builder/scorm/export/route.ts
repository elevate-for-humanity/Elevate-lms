import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { generateScormPackage, type ScormFormat } from '@/lib/scorm/course-package';
import { logger } from '@/lib/logger';
import { loadCourseSession } from '@/lib/studio/course-session';
import { coursePackageFromSession } from '@/lib/course-package/from-course-session';
import { evaluateCourseReadiness } from '@/lib/course-package/readiness';
import { ZodError } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const courseId = request.nextUrl.searchParams.get('courseId')?.trim();
  const requestedFormat = request.nextUrl.searchParams.get('format');
  const format: ScormFormat = requestedFormat === '2004' ? '2004' : '1.2';

  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  try {
    const coursePackage = coursePackageFromSession(await loadCourseSession(courseId));
    const readiness = evaluateCourseReadiness(coursePackage);
    if (!readiness.pass) {
      return NextResponse.json(
        {
          error: 'Course is not ready for SCORM export',
          code: 'COURSE_PACKAGE_NOT_READY',
          readiness,
        },
        { status: 422 },
      );
    }
    const pkg = generateScormPackage({ course: coursePackage, format });

    return new Response(new Uint8Array(pkg.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${pkg.filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Course data does not satisfy the canonical package contract',
          code: 'INVALID_COURSE_PACKAGE',
          issues: error.issues,
        },
        { status: 422 },
      );
    }
    logger.error('[course-builder/scorm-export] Export failed', error);
    return NextResponse.json({ error: 'Unable to generate SCORM package' }, { status: 500 });
  }
}
