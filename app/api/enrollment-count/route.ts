import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { applyRateLimit } from '@/lib/api/withRateLimit';
// AUTH: Intentionally public — returns aggregate counts only

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [totalRes, monthRes, todayRes, activeRes] = await Promise.all([
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).gte('enrolled_at', startOfMonth),
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).gte('enrolled_at', startOfDay),
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total: totalRes.count ?? 0,
        thisMonth: monthRes.count ?? 0,
        today: todayRes.count ?? 0,
        activeStudents: activeRes.count ?? 0,
        lastUpdated: now.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollment data' },
      { status: 500 }
    );
  }
}
