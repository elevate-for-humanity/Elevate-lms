import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get apprentice record
    const { data: apprentice, error: apprenticeError } = await supabase
      .from('apprentices')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (apprenticeError || !apprentice) {
      return NextResponse.json({ error: 'Apprentice record not found' }, { status: 404 });
    }

    // Find active session
    const { data: session, error: sessionError } = await supabase
      .from('checkin_sessions')
      .select('id, checkin_time, shop_id')
      .eq('apprentice_id', apprentice.id)
      .is('checkout_time', null)
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No active check-in session found' }, { status: 400 });
    }

    const checkoutTime = new Date();
    const checkinTime = new Date(session.checkin_time);
    const durationMs = checkoutTime.getTime() - checkinTime.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const hoursLogged = (durationMinutes / 60).toFixed(2);

    // Update session with checkout time
    const { error: updateError } = await supabase
      .from('checkin_sessions')
      .update({
        checkout_time: checkoutTime.toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq('id', session.id);

    if (updateError) {
      logger.error('Error updating session:', updateError);
      return NextResponse.json({ error: 'Failed to check out' }, { status: 500 });
    }

    // Log hours to hour_entries (canonical hours table)
    const hoursDecimal = durationMinutes / 60;

    const { error: entryError } = await supabase.from('hour_entries').insert({
      user_id: user.id,
      program_slug: 'barber-apprenticeship',
      work_date: checkinTime.toISOString().split('T')[0],
      hours_claimed: Math.round(hoursDecimal * 100) / 100,
      source_type: 'ojl',
      category: 'practical',
      notes: 'Auto-logged from check-in at shop',
      status: 'pending',
      entered_by_email: user.email ?? null,
      entered_at: checkoutTime.toISOString(),
    });

    if (entryError) {
      logger.error('Error creating hour entry:', entryError);
      // Don't fail checkout if hour logging fails
    }

    return NextResponse.json({
      success: true,
      checkoutTime: checkoutTime.toISOString(),
      durationMinutes: durationMinutes,
      hoursLogged: hoursLogged,
    });
  } catch (error) {
    logger.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/checkin/checkout', _POST);
