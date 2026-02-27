import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get period from query params
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

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

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Get apprentices assigned to this partner
    const { data: apprenticeUsers } = await db
      .from('partner_users')
      .select('user_id')
      .eq('partner_id', partnerUser.partner_id)
      .eq('role', 'apprentice');

    const apprenticeIds = apprenticeUsers?.map(a => a.user_id) || [];

    if (apprenticeIds.length === 0) {
      return NextResponse.json({
        isPartner: true,
        apprentices: [],
        summary: {
          totalHours: 0,
          avgHoursPerApprentice: 0,
          compliantCount: 0,
          totalApprentices: 0,
        },
        period,
      });
    }

    // Get apprentice profiles
    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, first_name, created_at')
      .in('id', apprenticeIds);

    // Get all progress entries for the period
    const { data: allProgress } = await db
      .from('progress_entries')
      .select('*')
      .eq('partner_id', partnerUser.partner_id)
      .in('apprentice_id', apprenticeIds)
      .gte('week_ending', startDate.toISOString())
      .order('week_ending', { ascending: false });

    // Get total hours (all time) for each apprentice
    const { data: totalProgressAll } = await db
      .from('progress_entries')
      .select('apprentice_id, hours_worked')
      .eq('partner_id', partnerUser.partner_id)
      .in('apprentice_id', apprenticeIds);

    // Calculate totals per apprentice
    const apprenticeTotals = new Map<string, number>();
    totalProgressAll?.forEach(entry => {
      const current = apprenticeTotals.get(entry.apprentice_id) || 0;
      apprenticeTotals.set(entry.apprentice_id, current + parseFloat(entry.hours_worked || 0));
    });

    // Build apprentice reports
    const apprenticeReports = (profiles || []).map(profile => {
      const apprenticeProgress = allProgress?.filter(p => p.apprentice_id === profile.id) || [];
      
      // Period hours
      const periodHours = apprenticeProgress.reduce(
        (sum, p) => sum + parseFloat(p.hours_worked || 0), 0
      );

      // Weekly hours (most recent week)
      const weeklyHours = apprenticeProgress[0] 
        ? parseFloat(apprenticeProgress[0].hours_worked || 0) 
        : 0;

      // Total hours (all time)
      const totalHours = apprenticeTotals.get(profile.id) || 0;

      // Last log date
      const lastLogDate = apprenticeProgress[0]?.week_ending || null;

      // Compliance status based on weekly minimum (30 hours)
      let complianceStatus: 'compliant' | 'warning' | 'non-compliant' = 'compliant';
      if (weeklyHours < 20) {
        complianceStatus = 'non-compliant';
      } else if (weeklyHours < 30) {
        complianceStatus = 'warning';
      }

      // Get enrollment date
      const startDate = profile.created_at;

      return {
        id: profile.id,
        name: profile.full_name || profile.first_name || 'Apprentice',
        totalHours,
        periodHours,
        weeklyHours,
        monthlyHours: period === 'month' ? periodHours : Math.round(periodHours / (period === 'week' ? 0.25 : period === 'quarter' ? 3 : 12)),
        targetHours: 2000,
        complianceStatus,
        lastLogDate,
        startDate,
        progress: (totalHours / 2000) * 100,
      };
    });

    // Calculate summary stats
    const totalPeriodHours = apprenticeReports.reduce((sum, a) => sum + a.periodHours, 0);
    const avgHoursPerApprentice = apprenticeReports.length > 0 
      ? Math.round(totalPeriodHours / apprenticeReports.length) 
      : 0;
    const compliantCount = apprenticeReports.filter(a => a.complianceStatus === 'compliant').length;

    return NextResponse.json({
      isPartner: true,
      apprentices: apprenticeReports,
      summary: {
        totalHours: totalPeriodHours,
        avgHoursPerApprentice,
        compliantCount,
        totalApprentices: apprenticeReports.length,
      },
      period,
    });
  } catch (error) {
    logger.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/pwa/shop-owner/reports', _GET);
