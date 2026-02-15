import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

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
      .single();

    if (!partnerUser) {
      return NextResponse.json({ 
        error: 'You are not authorized to approve hours',
      }, { status: 403 });
    }

    // Get pending progress entries
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
      .eq('status', 'pending')
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
