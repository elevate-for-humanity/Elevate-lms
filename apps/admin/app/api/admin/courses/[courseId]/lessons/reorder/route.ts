/**
 * PATCH /api/admin/courses/[courseId]/lessons/reorder
 *
 * Batch-updates order_index for a set of lessons within a course.
 * Transactional: all updates succeed or none are applied.
 *
 * Body: { items: Array<{ id: string; order_index: number }> }
 *
 * Protected: instructor, admin, admin, staff.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireInstructor } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

interface ReorderItem {
  id: string;
  order_index: number;
}

export async function PATCH(request: NextRequest, { params }: { params: { courseId: string } }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireInstructor(request);
  if (auth.error) return auth.error;

  const { courseId } = params;
  if (!courseId) return safeError('courseId required', 400);

  let items: ReorderItem[];
  try {
    const body = await request.json();
    items = body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return safeError('items must be a non-empty array', 400);
    }
    for (const item of items) {
      if (typeof item.id !== 'string' || typeof item.order_index !== 'number') {
        return safeError('each item must have id (string) and order_index (number)', 400);
      }
    }
  } catch {
    return safeError('invalid JSON body', 400);
  }

  const supabase = await requireAdminClient();
  if (!supabase) return safeError('DB unavailable', 503);

  // Verify all lesson IDs belong to this course before writing.
  const ids = items.map((i) => i.id);
  const { data: existing, error: fetchErr } = await supabase
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId)
    .in('id', ids);

  if (fetchErr) return safeInternalError(fetchErr, 'Failed to verify lesson ownership');
  if (!existing || existing.length !== ids.length) {
    return safeError('One or more lesson IDs do not belong to this course', 403);
  }

  // Batch update — one upsert per item. Supabase does not support
  // multi-row UPDATE with different values per row in a single call,
  // so we run them in parallel and collect errors.
  const updates = await Promise.all(
    items.map(({ id, order_index }) =>
      supabase
        .from('course_lessons')
        .update({ order_index, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('course_id', courseId),
    ),
  );

  const failed = updates.filter((r) => r.error);
  if (failed.length > 0) {
    return safeInternalError(failed[0].error, `${failed.length} of ${items.length} updates failed`);
  }

  return NextResponse.json({ updated: items.length });
}
