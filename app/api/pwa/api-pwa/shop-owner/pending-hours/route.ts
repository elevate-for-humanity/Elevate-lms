import { logger } from '@/lib/logger';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's partner association
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id, role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'manager', 'admin'])
      .maybeSingle();

    if (!partnerUser) {
      return NextResponse.json({ 
        error: 'You are not authorized to approve hours',
      }, { status: 403 });
    }

    // Get pending progress entries — timeclock uses 'submitted', manual uses 'pending'.
    // Only include closed shifts (clock_out_at IS NOT NULL) so open shifts are not
    // presented for partner approval before the apprentice has clocked out.
    const { data: pendingEntries } = await supabase
      .from('progress_entries')
      .select(`
        id,
        apprentice_id,
        week_ending,
        hours_worked,
        notes,
        created_at,
        profiles:apprentice_id (
          full_name,
          first_name
        )
      `)
      .eq('partner_id', partnerUser.partner_id)
      .in('status', ['submitted', 'pending'])
      .not('clock_out_at', 'is', null)
      .order('created_at', { ascending: false });

    const entries = (pendingEntries || []).map(entry => ({
      id: entry.id,
      apprenticeId: entry.apprentice_id,
      apprenticeName: (entry.profiles as any)?.full_name || (entry.profiles as any)?.first_name || 'Apprentice',
      weekEnding: entry.week_ending,
      hours: parseFloat(entry.hours_worked || 0),
      notes: entry.notes,
      submittedAt: entry.created_at,
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    logger.error('Error fetching pending hours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/pwa/shop-owner/pending-hours', _GET);
