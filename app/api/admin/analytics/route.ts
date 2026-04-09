import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withAuth } from '@/lib/api/withAuth';
import { safeInternalError } from '@/lib/api/safe-error';

const ADMIN_ROLES = ['admin', 'super_admin', 'staff'];

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req: NextRequest) => {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();

    // Role check — analytics data is admin-only
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getAdminClient();
    if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { data: profile } = await db
      .from('profiles').select('role').eq('id', user.id).single();

    if (!profile || !ADMIN_ROLES.includes(profile.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: pageViews }, { data: conversions }, { data: referrers }] = await Promise.all([
      supabase.from('page_views').select('path, created_at').gte('created_at', startDate),
      supabase.from('conversions').select('*').gte('created_at', startDate),
      supabase.from('page_views').select('referrer').gte('created_at', startDate).not('referrer', 'is', null),
    ]);

    const pageViewsByPath: Record<string, number> = {};
    (pageViews ?? []).forEach(v => { pageViewsByPath[v.path] = (pageViewsByPath[v.path] || 0) + 1; });

    const conversionsByType: Record<string, number> = {};
    const conversionValueByType: Record<string, number> = {};
    (conversions ?? []).forEach(c => {
      conversionsByType[c.conversion_type] = (conversionsByType[c.conversion_type] || 0) + 1;
      conversionValueByType[c.conversion_type] = (conversionValueByType[c.conversion_type] || 0) + parseFloat(c.value || '0');
    });

    const dailyViews: Record<string, number> = {};
    const dailyConversions: Record<string, number> = {};
    (pageViews ?? []).forEach(v => { const d = v.created_at.split('T')[0]; dailyViews[d] = (dailyViews[d] || 0) + 1; });
    (conversions ?? []).forEach(c => { const d = c.created_at.split('T')[0]; dailyConversions[d] = (dailyConversions[d] || 0) + 1; });

    const referrerCounts: Record<string, number> = {};
    (referrers ?? []).forEach(r => { if (r.referrer) referrerCounts[r.referrer] = (referrerCounts[r.referrer] || 0) + 1; });

    return NextResponse.json({
      data: {
        summary: {
          totalPageViews: pageViews?.length ?? 0,
          totalConversions: conversions?.length ?? 0,
          conversionRate: pageViews?.length ? (((conversions?.length ?? 0) / pageViews.length) * 100).toFixed(2) : '0.00',
          totalConversionValue: Object.values(conversionValueByType).reduce((s, v) => s + v, 0),
        },
        pageViewsByPath: Object.entries(pageViewsByPath).sort(([, a], [, b]) => b - a).slice(0, 20).map(([path, count]) => ({ path, count })),
        conversionsByType: Object.entries(conversionsByType).map(([type, count]) => ({ type, count, value: conversionValueByType[type] || 0 })),
        funnelSteps: [
          { step: 'page_view', count: pageViews?.length ?? 0 },
          { step: 'application_submitted', count: conversionsByType['application_submitted'] ?? 0 },
          { step: 'enrollment_completed', count: conversionsByType['enrollment_completed'] ?? 0 },
          { step: 'course_completed', count: conversionsByType['course_completed'] ?? 0 },
        ],
        dailyTrends: {
          dates: Object.keys(dailyViews).sort(),
          pageViews: Object.entries(dailyViews).sort(([a], [b]) => a.localeCompare(b)).map(([, c]) => c),
          conversions: Object.entries(dailyConversions).sort(([a], [b]) => a.localeCompare(b)).map(([, c]) => c),
        },
        topReferrers: Object.entries(referrerCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([referrer, count]) => ({ referrer, count })),
      },
      error: null,
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch analytics');
  }
}, { roles: ['admin', 'super_admin', 'staff'] });
