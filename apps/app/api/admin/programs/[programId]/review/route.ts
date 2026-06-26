/**
 * POST /api/admin/programs/[programId]/review
 *
 * Drives the program approval state machine.
 * Body: { action: 'submit' | 'approve' | 'reject' | 'archive' | 'revert_to_draft', notes?: string }
 *
 * State transitions:
 *   draft        → submit       → in_review
 *   in_review    → approve      → approved
 *   in_review    → reject       → rejected
 *   approved     → publish      → published  (via POST /versions — not this route)
 *   rejected     → revert_to_draft → draft
 *   any          → archive      → archived   (admin only)
 *
 * Roles:
 *   submit:          org_admin, org_owner, program_manager, admin, admin
 *   approve/reject:  reviewer, org_admin, org_owner, admin, admin
 *   archive:         admin, admin only
 *   revert_to_draft: same as submit
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
  { params }: { params: Promise<{ programId: string }> },
) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { programId } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action as ReviewAction | undefined;
  const notes = body.notes as string | undefined;

  if (!action || !TRANSITIONS[action]) {
    return safeError(`action must be one of: ${Object.keys(TRANSITIONS).join(', ')}`, 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Load current state
  const { data: program, error: loadErr } = await db
    .from('programs')
    .select('id, title, review_status, org_id')
    .eq('id', programId)
    .maybeSingle();

  if (loadErr) return safeInternalError(loadErr, 'Failed to load program');
  if (!program) return safeError('Program not found', 404);

  const { from, to } = TRANSITIONS[action];
  const currentStatus = program.review_status ?? 'draft';

  if (!from.includes(currentStatus)) {
    return safeError(
      `Cannot '${action}' a program in '${currentStatus}' state. Allowed from: ${from.join(', ')}`,
      409,
    );
  }

  const now = new Date().toISOString();

  // Apply transition
  const update: Record<string, unknown> = {
    review_status: to,
    updated_at: now,
  };

  if (action === 'submit') {
    update.submitted_for_review_at = now;
    update.submitted_by = auth.id;
  }
  if (action === 'approve' || action === 'reject') {
    update.reviewed_at = now;
    update.reviewed_by = auth.id;
    update.review_notes = notes ?? null;
  }

  const { error: updateErr } = await db.from('programs').update(update).eq('id', programId);

  if (updateErr) return safeInternalError(updateErr, 'Failed to update review status');

  // Write immutable audit log entry
  await db.from('program_review_log').insert({
    program_id: programId,
    action: action === 'revert_to_draft' ? 'reverted_to_draft' : action,
    from_status: currentStatus,
    to_status: to,
    actor_id: auth.id,
    notes: notes ?? null,
    created_at: now,
  });

  return NextResponse.json({ ok: true, review_status: to });
}
