import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
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

    // Update enrollment to mark orientation complete
    const { error } = await db
      .from('program_enrollments')
      .update({ 
        orientation_completed_at: new Date().toISOString(),
        status: 'orientation_complete',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .is('orientation_completed_at', null);

    // Also update program_enrollments state machine if exists
    await db
      .from('program_enrollments')
      .update({ enrollment_state: 'orientation_complete', updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('enrollment_state', 'confirmed');

    if (error) {
      logger.error('Error updating enrollment:', error);
      // Don't fail - let the flow continue
    }

    return NextResponse.json({ success: true, program });
  } catch (error) {
    logger.error('Orientation completion error:', error);
    return NextResponse.json({ success: true }); // Don't block flow
  }
}
