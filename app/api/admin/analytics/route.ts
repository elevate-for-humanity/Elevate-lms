import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    // Get page views
    const { data: pageViews, error: pageViewsError } = await db
      .from('page_views')
      .select('path, created_at')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false });

    if (pageViewsError) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Get conversions
    const { data: conversions, error: conversionsError } = await db
      .from('conversions')
      .select('*')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false });

    if (conversionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Aggregate page views by path
    const pageViewsByPath: Record<string, number> = {};
    pageViews?.forEach((view) => {
      pageViewsByPath[view.path] = (pageViewsByPath[view.path] || 0) + 1;
    });

    // Aggregate conversions by type
    const conversionsByType: Record<string, number> = {};
    const conversionValueByType: Record<string, number> = {};
    conversions?.forEach((conversion) => {
      conversionsByType[conversion.conversion_type] =
        (conversionsByType[conversion.conversion_type] || 0) + 1;
      conversionValueByType[conversion.conversion_type] =
        (conversionValueByType[conversion.conversion_type] || 0) +
        parseFloat(conversion.value || '0');
    });

    // Calculate conversion funnel
    const funnelSteps = [
      { step: 'page_view', count: pageViews?.length || 0 },
      {
        step: 'application_submitted',
        count: conversionsByType['application_submitted'] || 0,
      },
      {
        step: 'enrollment_completed',
        count: conversionsByType['enrollment_completed'] || 0,
      },
      {
        step: 'course_completed',
        count: conversionsByType['course_completed'] || 0,
      },
    ];

    // Calculate daily trends
    const dailyViews: Record<string, number> = {};
    const dailyConversions: Record<string, number> = {};

    pageViews?.forEach((view) => {
      const date = view.created_at.split('T')[0];
      dailyViews[date] = (dailyViews[date] || 0) + 1;
    });

    conversions?.forEach((conversion) => {
      const date = conversion.created_at.split('T')[0];
      dailyConversions[date] = (dailyConversions[date] || 0) + 1;
    });

    // Get top referrers
    const { data: referrers } = await db
      .from('page_views')
      .select('referrer')
      .gte('created_at', startDate)
      .not('referrer', 'is', null);

    const referrerCounts: Record<string, number> = {};
    referrers?.forEach((r) => {
      if (r.referrer) {
        referrerCounts[r.referrer] = (referrerCounts[r.referrer] || 0) + 1;
      }
    });

    const topReferrers = Object.entries(referrerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([referrer, count]) => ({ referrer, count }));

    return NextResponse.json({
      summary: {
        totalPageViews: pageViews?.length || 0,
        totalConversions: conversions?.length || 0,
        conversionRate: pageViews?.length
          ? (((conversions?.length || 0) / pageViews.length) * 100).toFixed(2)
          : '0.00',
        totalConversionValue: Object.values(conversionValueByType).reduce(
          (sum, val) => sum + val,
          0
        ),
      },
      pageViewsByPath: Object.entries(pageViewsByPath)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([path, count]) => ({ path, count })),
      conversionsByType: Object.entries(conversionsByType).map(
        ([type, count]) => ({
          type,
          count,
          value: conversionValueByType[type] || 0,
        })
      ),
      funnelSteps,
      dailyTrends: {
        dates: Object.keys(dailyViews).sort(),
        pageViews: Object.entries(dailyViews)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, count]) => count),
        conversions: Object.entries(dailyConversions)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, count]) => count),
      },
      topReferrers,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/admin/analytics', _GET);
