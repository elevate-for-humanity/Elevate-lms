/**
 * POST /api/admin/lms/courses
 *
 * Proxy to apps/admin — creates a canonical draft course.
 * Auth enforced here so the main-app domain is also protected.
 */
import { type NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { POST as adminPOST } from '@/apps/admin/app/api/admin/lms/courses/route';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return adminPOST(request);
}
