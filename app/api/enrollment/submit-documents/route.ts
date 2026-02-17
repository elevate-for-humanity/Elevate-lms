import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { program } = await req.json();

    // Update enrollment to mark documents submitted
    const { error } = await supabase
      .from('enrollments')
      .update({ 
        documents_submitted_at: new Date().toISOString(),
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .is('documents_submitted_at', null);

    // Also update program_enrollments state machine if exists
    await supabase
      .from('program_enrollments')
      .update({ enrollment_state: 'active', updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('enrollment_state', 'documents_complete');

    if (error) {
      logger.error('Error updating enrollment:', error);
      // Don't fail - let the flow continue
    }

    return NextResponse.json({ success: true, program });
  } catch (error) {
    logger.error('Document submission error:', error);
    return NextResponse.json({ success: true }); // Don't block flow
  }
}
