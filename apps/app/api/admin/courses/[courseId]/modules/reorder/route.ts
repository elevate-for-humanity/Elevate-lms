/**
 * PATCH /api/admin/courses/[courseId]/modules/reorder
 *
 * Batch-updates order_index for modules within a course.
 * Body: { items: Array<{ id: string; order_index: number }> }
 * Protected: instructor, admin, super_admin, staff.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireInstructor } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function PATCH(request: NextRequest, { params }: { params: { courseId: string } }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireInstructor(request);
  if (auth.error) return auth.error;

  const { courseId } = params;
  if (!courseId) return safeError('courseId required', 400);

  let items: { id: string; order_index: number }[];
  try {
    const body = await request.json();
    items = body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return safeError('items must be a non-empty array', 400);
    }
  } catch {
    return safeError('invalid JSON body', 400);
  }

  const supabase = await requireAdminClient();
  if (!supabase) return safeError('DB unavailable', 503);

  const ids = items.map((i) => i.id);
  const { data: existing, error: fetchErr } = await supabase
    .from('course_modules')
    .select('id')
    .eq('course_id', courseId)
    .in('id', ids);

  if (fetchErr) return safeInternalError(fetchErr, 'Failed to verify module ownership');
  if (!existing || existing.length !== ids.length) {
    return safeError('One or more module IDs do not belong to this course', 403);
  }

  const updates = await Promise.all(
    items.map(({ id, order_index }) =>
      supabase
        .from('course_modules')
        .update({ order_index, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('course_id', courseId),
    ),
  );

  const failed = updates.filter((r) => r.error);
  if (failed.length > 0) {
    return safeInternalError(failed[0].error, `${failed.length} updates failed`);
  }

  return NextResponse.json({ updated: items.length });
}
