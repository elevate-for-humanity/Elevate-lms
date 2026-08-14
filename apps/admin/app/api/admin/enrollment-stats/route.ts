// GET /api/admin/enrollment-stats
// Admin dashboard enrollment counts (admin-only route).

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireAdmin } from '@/lib/admin/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const supabase = await requireAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [totalRes, monthRes, todayRes, activeRes] = await Promise.all([
    supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
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
      .eq('enrollment_state', 'active'),
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
