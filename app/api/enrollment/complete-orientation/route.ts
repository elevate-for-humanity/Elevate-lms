import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { program } = await req.json();
    const now = new Date().toISOString();

    // Update program_enrollments (state machine)
    await db
      .from('program_enrollments')
      .update({
        orientation_completed_at: now,
        status: 'orientation_complete',
        enrollment_state: 'orientation_complete',
        updated_at: now,
      })
      .eq('user_id', user.id)
      .is('orientation_completed_at', null);

    // Update training_enrollments — this is what the apprentice portal gate reads
    const { error: teError } = await db
      .from('training_enrollments')
      .update({
        orientation_completed_at: now,
        updated_at: now,
      })
      .eq('user_id', user.id)
      .is('orientation_completed_at', null);

    if (teError) {
      logger.warn('[complete-orientation] training_enrollments update failed (non-fatal)', teError);
    }

    return NextResponse.json({ success: true, program });
  } catch (error) {
    logger.error('Orientation completion error:', error);
    return NextResponse.json({ success: true }); // Don't block flow
  }
}
export const POST = withApiAudit('/api/enrollment/complete-orientation', _POST);
