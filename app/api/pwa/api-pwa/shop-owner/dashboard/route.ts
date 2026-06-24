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
      .maybeSingle();

    if (!partnerUser) {
      return NextResponse.json({ 
        error: 'You are not associated with a partner shop',
        isPartner: false 
      }, { status: 404 });
    }

    // Get partner details
    const { data: partner } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerUser.partner_id)
      .maybeSingle();

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Get apprentices assigned to this partner
    const { data: apprenticeUsers } = await supabase
      .from('partner_users')
      .select('user_id')
      .eq('partner_id', partnerUser.partner_id)
      .eq('role', 'apprentice');

    const apprenticeIds = apprenticeUsers?.map(a => a.user_id) || [];

    // Get apprentice profiles
    const apprentices: any[] = [];
    if (apprenticeIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, first_name')
        .in('id', apprenticeIds);

      // Get progress for each apprentice
      for (const profile of profiles || []) {
        const { data: progress } = await supabase
          .from('progress_entries')
          .select('hours_worked, week_ending, status')
          .eq('apprentice_id', profile.id)
          .eq('partner_id', partnerUser.partner_id)
          .order('week_ending', { ascending: false });

        const totalHours = progress?.reduce((sum, p) => sum + parseFloat(p.hours_worked || 0), 0) || 0;
        const thisWeekEntry = progress?.[0];

        apprentices.push({
          id: profile.id,
          name: profile.full_name || profile.first_name || 'Apprentice',
          totalHours,
          weeklyHours: thisWeekEntry ? parseFloat(thisWeekEntry.hours_worked) : 0,
          status: 'active',
          progress: (totalHours / 2000) * 100,
        });
      }
    }

    // Get pending progress entries that need verification
    const { data: pendingEntries } = await supabase
      .from('progress_entries')
      .select('id')
      .eq('partner_id', partnerUser.partner_id)
      .in('status', ['submitted', 'pending']);

    // Calculate total hours this week across all apprentices
    const totalHoursThisWeek = apprentices.reduce((sum, a) => sum + a.weeklyHours, 0);

    return NextResponse.json({
      isPartner: true,
      shop: {
        id: partner.id,
        name: partner.name,
        status: partner.status,
      },
      role: partnerUser.role,
      apprentices,
      pendingEntries: pendingEntries?.length || 0,
      totalHoursThisWeek,
    });
  } catch (error) {
    logger.error('Error fetching shop dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/pwa/shop-owner/dashboard', _GET);
