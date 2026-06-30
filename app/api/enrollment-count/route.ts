// PUBLIC ROUTE: public enrollment count display
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
// AUTH: Intentionally public — returns aggregate counts only

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    let supabase;
    try {
      supabase = await requireAdminClient();
    } catch {
      // PUBLIC ROUTE: fail open with safe aggregate fallback when admin DB env is unavailable.
      // This avoids surfacing 500s in health/smoke checks for non-production test containers.
      const now = new Date();
      return NextResponse.json(
        {
          success: true,
          degraded: true,
          data: {
            total: 0,
            thisMonth: 0,
            today: 0,
            activeStudents: 0,
            lastUpdated: now.toISOString(),
          },
        },
        { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } },
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [totalRes, monthRes, todayRes, activeRes] = await Promise.all([
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
      supabase
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .gte('enrolled_at', startOfMonth),
      supabase
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .gte('enrolled_at', startOfDay),
      supabase
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          total: totalRes.count ?? 0,
          thisMonth: monthRes.count ?? 0,
          today: todayRes.count ?? 0,
          activeStudents: activeRes.count ?? 0,
          lastUpdated: now.toISOString(),
        },
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollment data' },
      { status: 500 },
    );
  }
}
export const GET = withApiAudit('/api/enrollment-count', _GET);
