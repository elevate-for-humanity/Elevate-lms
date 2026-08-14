// Instructor: approve or reject a practical submission
// POST /api/admin/barber/practicals/[submissionId]/review

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireInstructor } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireInstructor(request);
  if (auth.error) return auth.error;

  const { submissionId } = await params;
  if (!submissionId) return safeError('submissionId required', 400);

  try {
    const { decision, rejection_reason } = await request.json();
    if (!['approved', 'rejected'].includes(decision)) {
      return safeError('decision must be approved or rejected', 400);
    }

    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);

    if (decision === 'approved') {
      // Call DB function — atomically approves + increments count
      const { error } = await db.rpc('approve_barber_practical', {
        p_submission_id: submissionId,
        p_instructor_id: auth.id,
      });
      if (error) return safeDbError(error, 'Failed to approve practical');
    } else {
      const { error } = await db
        .from('barber_practical_submissions')
        .update({
          status: 'rejected',
          reviewed_by: auth.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejection_reason ?? 'Does not meet requirements',
        })
        .eq('id', submissionId)
        .eq('status', 'pending');
      if (error) return safeDbError(error, 'Failed to reject practical');
    }

    return NextResponse.json({ ok: true, decision });
  } catch (err) {
    return safeInternalError(err, 'Review failed');
  }
}
