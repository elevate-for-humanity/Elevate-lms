import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get apprentice record
    const { data: apprentice, error: apprenticeError } = await db
      .from('apprentices')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (apprenticeError || !apprentice) {
      return NextResponse.json({ activeSession: null });
    }

    // Check for active session
    const { data: session, error: sessionError } = await db
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
export const GET = withApiAudit('/api/checkin/status', _GET);
