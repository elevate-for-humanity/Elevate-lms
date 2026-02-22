import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Check-in code required' }, { status: 400 });
    }

    // Get apprentice record
    const { data: apprentice, error: apprenticeError } = await db
      .from('apprentices')
      .select('id, shop_id')
      .eq('user_id', user.id)
      .single();

    if (apprenticeError || !apprentice) {
      return NextResponse.json({ error: 'Apprentice record not found' }, { status: 404 });
    }

    // Check for existing active session
    const { data: existingSession } = await db
      .from('checkin_sessions')
      .select('id')
      .eq('apprentice_id', apprentice.id)
      .is('checkout_time', null)
      .single();

    if (existingSession) {
      return NextResponse.json({ error: 'Already checked in. Please check out first.' }, { status: 400 });
    }

    // Validate check-in code
    const { data: qrCode, error: qrError } = await db
      .from('shop_checkin_codes')
      .select('shop_id, shops(name)')
      .eq('code', code.toUpperCase())
      .gt('expires_at', new Date().toISOString())
      .single();

    if (qrError || !qrCode) {
      return NextResponse.json({ error: 'Invalid or expired check-in code' }, { status: 400 });
    }

    // Create check-in session
    const checkInTime = new Date().toISOString();
    const { data: session, error: sessionError } = await db
      .from('checkin_sessions')
      .insert({
        apprentice_id: apprentice.id,
        shop_id: qrCode.shop_id,
        checkin_time: checkInTime,
        checkin_code: code.toUpperCase(),
      })
      .select()
      .single();

    if (sessionError) {
      logger.error('Error creating session:', sessionError);
      return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      shopName: (qrCode as any).shops?.name || 'Shop',
      checkInTime: checkInTime,
    });
  } catch (error) {
    logger.error('Check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
