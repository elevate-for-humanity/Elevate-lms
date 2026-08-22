import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireAdmin } from '@/lib/admin/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Retired compatibility endpoint.
 *
 * The LMS is a learner runtime and must not author or publish courses. All
 * course creation is owned by POST /api/admin/course-builder -> Course Factory.
 * This endpoint intentionally performs no generation and no database writes.
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  return NextResponse.json(
    {
      error: 'LMS_COURSE_GENERATOR_RETIRED',
      message: 'Use the Unified Course Builder for all course generation.',
      canonicalSurface: '/admin/course-builder',
      canonicalEndpoint: '/api/admin/course-builder',
    },
    { status: 410 },
  );
}
