/**
 * GET  /api/mentor/approvals
 * POST /api/mentor/approvals/[id]/approve
 *
 * Mentor approval queue — mentorship requests awaiting mentor acceptance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { emitEvent } from '@/lib/platform/events';

const ALLOWED_ROLES = ['mentor', 'admin'];

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;
  if (!ALLOWED_ROLES.includes(auth.role ?? '')) return safeError('Forbidden', 403);

  try {
    const supabase = await getAdminClient();

    let q = supabase
      .from('mentorships')
      .select(`
        id, status, requested_at, notes,
        mentee_id,
        profiles!mentorships_mentee_id_fkey(full_name, email, avatar_url)
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    if (auth.role === 'mentor') {
      q = q.eq('mentor_id', auth.id) as typeof q;
    }

    const { data, error } = await q;
    if (error) return safeDbError(error, 'Failed to fetch approvals');

    return NextResponse.json({ approvals: data ?? [], count: data?.length ?? 0 });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch approvals');
  }
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;
  if (!ALLOWED_ROLES.includes(auth.role ?? '')) return safeError('Forbidden', 403);

  try {
    const body = await req.json();
    const { mentorship_id, action } = body; // action: 'approve' | 'decline'

    if (!mentorship_id || !['approve', 'decline'].includes(action)) {
      return safeError('mentorship_id and action (approve|decline) are required', 400);
    }

    const supabase = await getAdminClient();

    // Verify ownership
    if (auth.role === 'mentor') {
      const { data: ms } = await supabase.from('mentorships').select('mentor_id').eq('id', mentorship_id).single();
      if (!ms || ms.mentor_id !== auth.id) return safeError('Forbidden', 403);
    }

    const newStatus = action === 'approve' ? 'active' : 'declined';
    const { data, error } = await supabase
      .from('mentorships')
      .update({ status: newStatus, started_at: action === 'approve' ? new Date().toISOString() : null })
      .eq('id', mentorship_id)
      .select('id, status')
      .single();

    if (error) return safeDbError(error, 'Failed to update mentorship');

    await emitEvent(`mentorship.${action}d`, 'lms', {
      actor_id: auth.id,
      actor_type: 'user',
      subject_id: mentorship_id,
      subject_type: 'mentorship',
      message: `Mentorship ${action}d by mentor`,
    });

    return NextResponse.json(data);
  } catch (err) {
    return safeInternalError(err, 'Failed to process approval');
  }
}
