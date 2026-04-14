// GET /api/admin/enrollment-stats
// Returns live enrollment counts used by EnrollmentCounter on the marketing site.
// Public read — no auth required (counts only, no PII).

// PUBLIC ROUTE: aggregate enrollment counts for marketing display

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  const supabase = await getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [totalRes, monthRes, todayRes, activeRes] = await Promise.all([
    supabase
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfMonth),
    supabase
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfDay),
    supabase
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ]);

  return NextResponse.json({
    data: {
      total: totalRes.count ?? 0,
      thisMonth: monthRes.count ?? 0,
      today: todayRes.count ?? 0,
      activeStudents: activeRes.count ?? 0,
    },
  });
}
