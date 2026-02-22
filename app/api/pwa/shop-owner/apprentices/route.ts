import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's partner association
    const { data: partnerUser } = await db
      .from('partner_users')
      .select('partner_id, role')
      .eq('user_id', user.id)
      .single();

    if (!partnerUser) {
      return NextResponse.json({ 
        error: 'You are not associated with a partner shop',
        isPartner: false 
      }, { status: 404 });
    }

    // Get apprentices assigned to this partner
    const { data: apprenticeUsers } = await db
      .from('partner_users')
      .select('user_id, created_at')
      .eq('partner_id', partnerUser.partner_id)
      .eq('role', 'apprentice');

    const apprenticeIds = apprenticeUsers?.map(a => a.user_id) || [];

    if (apprenticeIds.length === 0) {
      return NextResponse.json({
        isPartner: true,
        apprentices: [],
        counts: {
          active: 0,
          pending: 0,
          total: 0,
        },
      });
    }

    // Get apprentice profiles
    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, first_name, email, created_at')
      .in('id', apprenticeIds);

    // Get progress for each apprentice
    const { data: allProgress } = await db
      .from('progress_entries')
      .select('apprentice_id, hours_worked, week_ending, status')
      .eq('partner_id', partnerUser.partner_id)
      .in('apprentice_id', apprenticeIds)
      .order('week_ending', { ascending: false });

    // Build apprentice list with progress data
    const apprentices = (profiles || []).map(profile => {
      const apprenticeProgress = allProgress?.filter(p => p.apprentice_id === profile.id) || [];
      const assignmentRecord = apprenticeUsers?.find(a => a.user_id === profile.id);
      
      const totalHours = apprenticeProgress.reduce(
        (sum, p) => sum + parseFloat(p.hours_worked || 0), 0
      );

      // Get this week's hours
      const thisWeekEntry = apprenticeProgress[0];
      const weeklyHours = thisWeekEntry ? parseFloat(thisWeekEntry.hours_worked || 0) : 0;

      // Calculate weekly average
      const weekCount = new Set(apprenticeProgress.map(e => e.week_ending)).size;
      const weeklyAvg = weekCount > 0 ? Math.round(totalHours / weekCount) : 0;

      // Determine status
      const hasStarted = totalHours > 0 || apprenticeProgress.length > 0;
      const status = hasStarted ? 'active' : 'pending';

      return {
        id: profile.id,
        name: profile.full_name || profile.first_name || 'Apprentice',
        email: profile.email,
        totalHours,
        weeklyHours,
        weeklyAvg,
        status,
        progress: (totalHours / 2000) * 100,
        startDate: assignmentRecord?.created_at || profile.created_at,
        lastActivity: thisWeekEntry?.week_ending || null,
      };
    });

    // Sort: active first, then by total hours descending
    apprentices.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'active' ? -1 : 1;
      }
      return b.totalHours - a.totalHours;
    });

    const activeCount = apprentices.filter(a => a.status === 'active').length;
    const pendingCount = apprentices.filter(a => a.status === 'pending').length;

    return NextResponse.json({
      isPartner: true,
      apprentices,
      counts: {
        active: activeCount,
        pending: pendingCount,
        total: apprentices.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching apprentices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
