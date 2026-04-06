import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { program, enrollmentId } = await req.json();
    const now = new Date().toISOString();

    // Resolve target enrollment — prefer explicit id, fall back to most recent pending
    let targetId: string | null = enrollmentId ?? null;

    if (!targetId) {
      const { data: pending } = await supabase
        .from('program_enrollments')
        .select('id')
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

    // Single scoped update — ownership re-checked on write
    const { error: peError } = await supabase
      .from('program_enrollments')
      .update({
        orientation_completed_at: now,
        status: 'orientation_complete',
        enrollment_state: 'orientation_complete',
        updated_at: now,
      })
      .eq('id', targetId)
      .eq('user_id', user.id);

    if (peError) {
      logger.error('[complete-orientation] program_enrollments update failed', peError);
      return NextResponse.json({ error: 'Failed to complete orientation' }, { status: 500 });
    }

    // Update training_enrollments — scoped to user + not yet completed
    const { error: teError } = await supabase
      .from('training_enrollments')
      .update({ orientation_completed_at: now, updated_at: now })
      .eq('user_id', user.id)
      .is('orientation_completed_at', null);

    if (teError) {
      logger.warn('[complete-orientation] training_enrollments update failed (non-fatal)', teError);
    }

    return NextResponse.json({ success: true, program, enrollmentId: targetId });
  } catch (error) {
    logger.error('Orientation completion error:', error);
    return NextResponse.json({ error: 'Failed to complete orientation' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/enrollment/complete-orientation', _POST);
