import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createServerSupabaseClient } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createServerSupabaseClient();

  // Get DOL/DWD reporting data
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(
      `
      *,
      profiles (full_name, email),
      courses (title, duration_hours)
    `
    )
    .in('funding_source', ['WIOA', 'WRG', 'JRI', 'DOL']);

  return NextResponse.json({
    provider: 'DOL/DWD',
    status: 'active',
    total_enrollments: enrollments?.length || 0,
    by_funding: {
      WIOA: enrollments?.filter((e) => e.funding_source === 'WIOA').length || 0,
      WRG: enrollments?.filter((e) => e.funding_source === 'WRG').length || 0,
      JRI: enrollments?.filter((e) => e.funding_source === 'JRI').length || 0,
      DOL: enrollments?.filter((e) => e.funding_source === 'DOL').length || 0,
    },
    integration_status: 'ready',
  });
}
