/** RETIRED: repair/missing generation is owned by POST /api/admin/course-builder action=repair. */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const { courseId } = await params;

  return NextResponse.json(
    {
      error: 'COURSE_BUILDER_ROOT_REQUIRED',
      message: 'Course repair moved to the canonical Course Builder orchestration boundary.',
      canonicalEndpoint: '/api/admin/course-builder',
      action: 'repair',
      courseId,
    },
    { status: 410 },
  );
}
