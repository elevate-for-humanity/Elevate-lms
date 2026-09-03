/** RETIRED: lesson patching is owned by POST /api/admin/course-builder action=patch-lesson. */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  return NextResponse.json({
    error: 'COURSE_BUILDER_ROOT_REQUIRED',
    canonicalEndpoint: '/api/admin/course-builder',
    action: 'patch-lesson',
  }, { status: 410 });
}
