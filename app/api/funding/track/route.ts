import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { createServerSupabaseClient } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const body = await parseBody<Record<string, any>>(request);
  const supabase = await createServerSupabaseClient();

  const { data, error }: any = await supabase
    .from('funding_tracking')
    .insert({
      student_id: body.student_id,
      funding_source: body.funding_source, // WIOA, WRG, JRI
      program_id: body.program_id,
      amount: body.amount || 0,
      status: 'active',
      start_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true, tracking: data });
}

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createServerSupabaseClient();

  const { data }: any = await supabase
    .from('funding_tracking')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({
    funding_sources: ['WIOA', 'WRG', 'JRI'],
    total_tracked: data?.length || 0,
    records: data,
  });
}
export const GET = withApiAudit('/api/funding/track', _GET);
export const POST = withApiAudit('/api/funding/track', _POST);
