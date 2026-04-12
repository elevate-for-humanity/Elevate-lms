import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createServerSupabaseClient();

  // Get DOL/DWD reporting data
  const { data: rawDolEnrollments } = await supabase
    .from('program_enrollments')
    .select(`id, user_id, funding_source, courses:course_id(title, duration_hours)`)
    .in('funding_source', ['WIOA', 'WRG', 'JRI', 'DOL']);

  // Hydrate profiles separately (user_id → auth.users, no FK to profiles)
  const dolUserIds = [...new Set((rawDolEnrollments ?? []).map((e: any) => e.user_id).filter(Boolean))];
  const { data: dolProfiles } = dolUserIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', dolUserIds)
    : { data: [] };
  const dolProfileMap = Object.fromEntries((dolProfiles ?? []).map((p: any) => [p.id, p]));
  const enrollments = (rawDolEnrollments ?? []).map((e: any) => ({ ...e, profiles: dolProfileMap[e.user_id] ?? null }));

  return NextResponse.json({
    provider: 'DOL/DWD',
    status: 'active',
    total_enrollments: enrollments?.length || 0,
    by_funding: {
      WIOA: enrollments?.filter((e) => e.funding_source === 'WIOA').length || 0,
      WRG: enrollments?.filter((e) => e.funding_source === 'WRG').length || 0,
      'Job Ready Indy': enrollments?.filter((e) => e.funding_source === 'JRI').length || 0,
      DOL: enrollments?.filter((e) => e.funding_source === 'DOL').length || 0,
    },
    integration_status: 'ready',
  });
}
export const GET = withApiAudit('/api/analytics/metrics/dol-dwd', _GET);
