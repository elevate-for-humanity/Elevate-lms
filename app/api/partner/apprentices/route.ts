import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program');

    // Get partner user
    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!partnerUser) {
      return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
    }

    // Check program access
    if (programId) {
      const { data: access } = await supabase
        .from('partner_program_access')
        .select('id')
        .eq('partner_id', partnerUser.partner_id)
        .eq('program_id', programId)
        .is('revoked_at', null)
        .single();

      if (!access) {
        return NextResponse.json({ error: 'No access to this program' }, { status: 403 });
      }
    }

    // Get apprentices assigned to this partner
    let query = supabase
      .from('apprenticeships')
      .select(`
        id,
        apprentice_id,
        program_id,
        start_date,
        status,
        profiles:apprentice_id(id, full_name, email, avatar_url)
      `)
      .eq('partner_id', partnerUser.partner_id)
      .eq('status', 'active');

    if (programId) {
      query = query.eq('program_id', programId);
    }

    const { data: apprenticeships, error } = await query;

    if (error) {
      logger.error('Failed to fetch apprentices:', error);
      return NextResponse.json({ error: 'Failed to fetch apprentices' }, { status: 500 });
    }

    // Get total hours for each apprentice
    const apprentices = await Promise.all(
      (apprenticeships || []).map(async (a) => {
        const { data: progressSum } = await supabase
          .from('progress_entries')
          .select('hours_worked')
          .eq('apprentice_id', a.apprentice_id)
          .eq('partner_id', partnerUser.partner_id);

        const totalHours = (progressSum || []).reduce((sum, p) => sum + (p.hours_worked || 0), 0);
        const profile = a.profiles as { id: string; full_name: string; email: string; avatar_url: string | null } | null;

        return {
          id: profile?.id || a.apprentice_id,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || '',
          avatar_url: profile?.avatar_url,
          start_date: a.start_date,
          total_hours: totalHours,
        };
      })
    );

    return NextResponse.json({ apprentices });
  } catch (error) {
    logger.error('Apprentices API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
