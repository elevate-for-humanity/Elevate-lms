/**
 * PATCH /api/admin/lms/courses/[courseId] — update a course
 * DELETE /api/admin/lms/courses/[courseId] — archive a course
 */
import { type NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import {
  PATCH as adminPATCH,
  DELETE as adminDELETE,
} from '@/apps/admin/app/api/admin/lms/courses/[courseId]/route';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return adminPATCH(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ courseId: string }> }) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return adminDELETE(request, context);
}
