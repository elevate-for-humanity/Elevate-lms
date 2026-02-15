import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { program } = await req.json();

    // Update enrollment to mark orientation complete
    const { error } = await supabase
      .from('enrollments')
      .update({ 
        orientation_completed_at: new Date().toISOString(),
        status: 'orientation_complete'
      })
      .eq('user_id', user.id)
      .is('orientation_completed_at', null);

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
