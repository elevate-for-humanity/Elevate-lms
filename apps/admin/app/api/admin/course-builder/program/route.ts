/** RETIRED: course program configuration is owned by POST /api/admin/course-builder action=save-program-config. */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  return NextResponse.json(
    {
      error: 'COURSE_BUILDER_ROOT_REQUIRED',
      message: 'Course program configuration moved to the canonical Course Builder root.',
      canonicalEndpoint: '/api/admin/course-builder',
      action: 'save-program-config',
    },
    { status: 410 },
  );
}
