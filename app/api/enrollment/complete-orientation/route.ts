import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { canCompleteOrientation, normalizeEnrollmentState } from '@/lib/enrollment/enrollment-flow';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { program, enrollmentId } = await req.json();
    const now = new Date().toISOString();

    let targetId: string | null = enrollmentId ?? null;

    if (!targetId) {
      const { data: pending } = await supabase
        .from('program_enrollments')
        .select('id, enrollment_state')
        .eq('user_id', user.id)
        .is('orientation_completed_at', null)
        .order('enrolled_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      targetId = pending?.id ?? null;
    }

    if (!targetId) {
      return NextResponse.json({ error: 'No pending enrollment found' }, { status: 404 });
    }

    const { data: row } = await supabase
      .from('program_enrollments')
      .select('enrollment_state')
      .eq('id', targetId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!row || !canCompleteOrientation(normalizeEnrollmentState(row.enrollment_state))) {
      return NextResponse.json({ error: 'Cannot complete orientation from current state' }, { status: 400 });
    }

    const { error: peError } = await supabase
      .from('program_enrollments')
      .update({
        orientation_completed_at: now,
        status: 'active',
        enrollment_state: 'enrolled',
        next_required_action: 'DOCUMENTS',
        updated_at: now,
      })
      .eq('id', targetId)
      .eq('user_id', user.id);

    if (peError) {
      logger.error('[complete-orientation] program_enrollments update failed', peError);
      return NextResponse.json({ error: 'Failed to complete orientation' }, { status: 500 });
    }

    return NextResponse.json({ success: true, program, enrollmentId: targetId });
  } catch (error) {
    logger.error('Orientation completion error:', error);
    return NextResponse.json({ error: 'Failed to complete orientation' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/enrollment/complete-orientation', _POST);
