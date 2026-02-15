import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const MILESTONES = [
  { hours: 250, label: 'Foundation', color: 'blue' },
  { hours: 500, label: 'Developing', color: 'purple' },
  { hours: 750, label: 'Intermediate', color: 'amber' },
  { hours: 1000, label: 'Advanced', color: 'green' },
  { hours: 1500, label: 'Expert', color: 'pink' },
  { hours: 2000, label: 'Licensed', color: 'emerald' },
];

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

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
      .single();

    if (!partnerUser) {
      return NextResponse.json({ 
        error: 'You are not associated with a partner shop',
        isPartner: false 
      }, { status: 404 });
    }

    // Get apprentices assigned to this partner
    const { data: apprenticeUsers } = await supabase
      .from('partner_users')
      .select('user_id')
      .eq('partner_id', partnerUser.partner_id)
      .eq('role', 'apprentice');

    const apprenticeIds = apprenticeUsers?.map(a => a.user_id) || [];

    if (apprenticeIds.length === 0) {
      return NextResponse.json({
        isPartner: true,
        apprentices: [],
        weeklyData: [],
        milestones: MILESTONES,
        summary: {
          totalShopHours: 0,
          avgProgress: 0,
          totalWeeklyHours: 0,
        },
      });
    }

    // Get apprentice profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, first_name, created_at')
      .in('id', apprenticeIds);

    // Get all progress entries for apprentices
    const { data: allProgress } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('partner_id', partnerUser.partner_id)
      .in('apprentice_id', apprenticeIds)
      .order('week_ending', { ascending: false });

    // Calculate weekly data (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const recentProgress = allProgress?.filter(p => 
      new Date(p.week_ending) >= fourWeeksAgo
    ) || [];

    // Group by week
    const weeklyMap = new Map<string, number>();
    recentProgress.forEach(entry => {
      const weekKey = entry.week_ending;
      const current = weeklyMap.get(weekKey) || 0;
      weeklyMap.set(weekKey, current + parseFloat(entry.hours_worked || 0));
    });

    const weeklyData = Array.from(weeklyMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-4)
      .map((entry, index) => ({
        week: `Week ${index + 1}`,
        weekEnding: entry[0],
        hours: Math.round(entry[1]),
      }));

    // Build apprentice progress data
    const apprenticeProgress = (profiles || []).map(profile => {
      const apprenticeEntries = allProgress?.filter(p => p.apprentice_id === profile.id) || [];
      
      const totalHours = apprenticeEntries.reduce(
        (sum, p) => sum + parseFloat(p.hours_worked || 0), 0
      );

      // Calculate weekly average
      const weekCount = new Set(apprenticeEntries.map(e => e.week_ending)).size;
      const weeklyAvg = weekCount > 0 ? Math.round(totalHours / weekCount) : 0;

      // Determine trend based on last 2 weeks
      const lastTwoWeeks = apprenticeEntries.slice(0, 2);
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (lastTwoWeeks.length >= 2) {
        const recent = parseFloat(lastTwoWeeks[0]?.hours_worked || 0);
        const previous = parseFloat(lastTwoWeeks[1]?.hours_worked || 0);
        if (recent > previous * 1.1) trend = 'up';
        else if (recent < previous * 0.9) trend = 'down';
      }

      // Find next milestone
      const nextMilestone = MILESTONES.find(m => totalHours < m.hours)?.hours || 2000;

      return {
        id: profile.id,
        name: profile.full_name || profile.first_name || 'Apprentice',
        totalHours,
        targetHours: 2000,
        weeklyAvg,
        trend,
        nextMilestone,
        progress: (totalHours / 2000) * 100,
        startDate: profile.created_at,
      };
    });

    // Calculate summary stats
    const totalShopHours = apprenticeProgress.reduce((sum, a) => sum + a.totalHours, 0);
    const avgProgress = apprenticeProgress.length > 0
      ? apprenticeProgress.reduce((sum, a) => sum + a.progress, 0) / apprenticeProgress.length
      : 0;
    const totalWeeklyHours = weeklyData.reduce((sum, w) => sum + w.hours, 0);

    // Find next graduation (apprentice closest to 2000 hours)
    const sortedByProgress = [...apprenticeProgress].sort((a, b) => b.totalHours - a.totalHours);
    const nextGraduation = sortedByProgress.find(a => a.totalHours < 2000);

    return NextResponse.json({
      isPartner: true,
      apprentices: apprenticeProgress,
      weeklyData,
      milestones: MILESTONES,
      summary: {
        totalShopHours,
        avgProgress: Math.round(avgProgress * 10) / 10,
        totalWeeklyHours,
        nextGraduation: nextGraduation ? {
          name: nextGraduation.name,
          estimatedDate: (() => {
            const remaining = 2000 - nextGraduation.totalHours;
            if (nextGraduation.weeklyAvg <= 0) return null;
            const weeksRemaining = Math.ceil(remaining / nextGraduation.weeklyAvg);
            const date = new Date();
            date.setDate(date.getDate() + (weeksRemaining * 7));
            return date.toISOString();
          })(),
        } : null,
      },
    });
  } catch (error) {
    logger.error('Error fetching shop progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
