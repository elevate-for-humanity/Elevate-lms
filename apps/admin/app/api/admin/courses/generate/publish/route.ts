import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Retired compatibility endpoint.
 *
 * Course creation and publication now have exactly one authority:
 *   POST /api/admin/course-builder/pipeline       -> lib/course-factory
 *   POST /api/admin/lms/courses/[courseId]/publish -> persisted procurement gate
 *
 * This endpoint intentionally performs no writes. Keeping a small authenticated
 * compatibility response is safer than preserving a second persistence engine.
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  return NextResponse.json(
    {
      error: 'LEGACY_COURSE_PUBLISHER_RETIRED',
      message: 'Use the Unified Course Builder. Generate through /api/admin/course-builder/pipeline and publish the resulting canonical course through /api/admin/lms/courses/[courseId]/publish.',
      canonicalGenerationEndpoint: '/api/admin/course-builder/pipeline',
      canonicalPublishEndpoint: '/api/admin/lms/courses/[courseId]/publish',
    },
    { status: 410 },
  );
}
