import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/require-api-role';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireApiRole(['workforce_board', 'admin', 'super_admin', 'org_admin']);
    if (auth instanceof NextResponse) return auth;

    const { db } = auth;

    // Get enrollment and completion data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: enrollments } = await db
      .from('student_enrollments')
      .select('created_at, status')
      .gte('created_at', sixMonthsAgo.toISOString());

    // Aggregate by month
    const monthlyData: Record<string, { total: number; completed: number; employed: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthlyData[months[d.getMonth()]] = { total: 0, completed: 0, employed: 0 };
    }

    (enrollments || []).forEach(e => {
      const month = months[new Date(e.created_at).getMonth()];
      if (monthlyData[month]) {
        monthlyData[month].total++;
        if (e.status === 'completed') monthlyData[month].completed++;
        if (e.status === 'employed') monthlyData[month].employed++;
      }
    });

    // Real rates only — null when insufficient data, never synthetic
    const trends = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      enrollments: data.total,
      completions: data.completed,
      employed: data.employed,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : null,
      employmentRate: data.total > 0 ? Math.round((data.employed / data.total) * 100) : null,
    }));

    return NextResponse.json({ trends });
  } catch (error) {
    logger.error('Performance trends error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/workforce-board/performance-trends', _GET);
