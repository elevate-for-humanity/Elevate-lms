import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get apprentice record
    const { data: apprentice, error: apprenticeError } = await supabase
      .from('apprentices')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (apprenticeError || !apprentice) {
      return NextResponse.json({ activeSession: null });
    }

    // Check for active session
    const { data: session, error: sessionError } = await supabase
      .from('checkin_sessions')
      .select('id, checkin_time, shop_id, shops(name)')
      .eq('apprentice_id', apprentice.id)
      .is('checkout_time', null)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ activeSession: null });
    }

    return NextResponse.json({
      activeSession: {
        id: session.id,
        shopName: (session as any).shops?.name || 'Shop',
        checkInTime: session.checkin_time,
      },
    });
  } catch (error) {
    logger.error('Check-in status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
