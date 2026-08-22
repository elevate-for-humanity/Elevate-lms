/** RETIRED: complete course generation is owned by POST /api/admin/course-builder. */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  return NextResponse.json(
    {
      error: 'COURSE_BUILDER_ROOT_REQUIRED',
      message: 'Complete course generation moved to the canonical Course Builder orchestration boundary.',
      canonicalEndpoint: '/api/admin/course-builder',
      action: 'generate',
    },
    { status: 410 },
  );
}
