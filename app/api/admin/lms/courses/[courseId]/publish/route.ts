/**
 * POST /api/admin/lms/courses/[courseId]/publish — publish a course
 */
import { type NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { POST as adminPOST } from '@/apps/admin/app/api/admin/lms/courses/[courseId]/publish/route';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return adminPOST(request, context);
}
