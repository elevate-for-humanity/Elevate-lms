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

    const auth = await requireApiRole(['employer', 'admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;

    // Employer needs cross-user apprentice data; role gate is the auth boundary
    const db = auth.adminDb || auth.db;

    // Get apprentice data for hiring trends (last 6 months)
    const { data: apprentices } = await db
      .from('apprentices')
      .select('created_at, status')
      .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hiringData: Record<string, { hires: number; applications: number }> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      hiringData[months[d.getMonth()]] = { hires: 0, applications: 0 };
    }

    // Aggregate from real data only — no synthetic fallbacks
    (apprentices || []).forEach(a => {
      const month = months[new Date(a.created_at).getMonth()];
      if (hiringData[month]) {
        hiringData[month].applications++;
        if (a.status === 'active' || a.status === 'completed') {
          hiringData[month].hires++;
        }
      }
    });

    const trends = Object.entries(hiringData).map(([month, data]) => ({
      month,
      hires: data.hires,
      applications: data.applications,
    }));

    return NextResponse.json({ trends });
  } catch (error) {
    logger.error('Hiring trends error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/employer/hiring-trends', _GET);
