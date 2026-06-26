/**
 * POST /api/admin/courses/[courseId]/review
 *
 * Drives the course approval state machine.
 * Body: { action: 'submit' | 'approve' | 'reject' | 'archive' | 'revert_to_draft', notes?: string }
 *
 * Publish (approved → published) is handled by POST /api/admin/courses/[courseId]/versions
 * which snapshots state and sets review_status = 'published'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

type ReviewAction = 'submit' | 'approve' | 'reject' | 'archive' | 'revert_to_draft';

const TRANSITIONS: Record<ReviewAction, { from: string[]; to: string }> = {
  submit: { from: ['draft', 'rejected'], to: 'in_review' },
  approve: { from: ['in_review'], to: 'approved' },
  reject: { from: ['in_review'], to: 'rejected' },
  archive: { from: ['draft', 'in_review', 'approved', 'published', 'rejected'], to: 'archived' },
  revert_to_draft: { from: ['rejected', 'in_review'], to: 'draft' },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { courseId } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action as ReviewAction | undefined;
  const notes = body.notes as string | undefined;

  if (!action || !TRANSITIONS[action]) {
    return safeError(`action must be one of: ${Object.keys(TRANSITIONS).join(', ')}`, 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data: course, error: loadErr } = await db
    .from('courses')
    .select('id, title, review_status, org_id')
    .eq('id', courseId)
    .maybeSingle();

  if (loadErr) return safeInternalError(loadErr, 'Failed to load course');
  if (!course) return safeError('Course not found', 404);

  const { from, to } = TRANSITIONS[action];
  const currentStatus = course.review_status ?? 'draft';

  if (!from.includes(currentStatus)) {
    return safeError(
      `Cannot '${action}' a course in '${currentStatus}' state. Allowed from: ${from.join(', ')}`,
      409,
    );
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { review_status: to, updated_at: now };

  if (action === 'submit') {
    update.submitted_for_review_at = now;
    update.submitted_by = auth.id;
  }
  if (action === 'approve' || action === 'reject') {
    update.reviewed_at = now;
    update.reviewed_by = auth.id;
    update.review_notes = notes ?? null;
  }

  const { error: updateErr } = await db.from('courses').update(update).eq('id', courseId);
  if (updateErr) return safeInternalError(updateErr, 'Failed to update review status');

  // Audit log — reuse program_review_log with course_id
  await db.from('program_review_log').insert({
    course_id: courseId,
    action: action === 'revert_to_draft' ? 'reverted_to_draft' : action,
    from_status: currentStatus,
    to_status: to,
    actor_id: auth.id,
    notes: notes ?? null,
    created_at: now,
  });

  return NextResponse.json({ ok: true, review_status: to });
}
