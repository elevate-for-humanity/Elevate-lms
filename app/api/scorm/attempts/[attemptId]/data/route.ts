
import { getAdminClient } from '@/lib/supabase/admin';

// app/api/scorm/attempts/[attemptId]/data/route.ts
import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
  const supabase = await getAdminClient();
  const { attemptId } = await params;
  const session = await requireApiAuth();

  const { data: attempt } = await supabase
    .from('scorm_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('student_id', (session as string).userId)
    .single();

  if (!attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
  }

  const { data: cmiData } = await supabase
    .from('scorm_cmi_data')
    .select('*')
    .eq('attempt_id', attemptId);

  const dataMap: Record<string, string> = {};
  for (const item of cmiData || []) {
    dataMap[item.cmi_key] = item.cmi_value;
  }

  return NextResponse.json({ data: dataMap });
}

async function _POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await getAdminClient();
  const { attemptId } = await params;
  const session = await requireApiAuth();
  const { data } = await request.json();

  const { data: attempt } = await supabase
    .from('scorm_attempts')
    .select('*')
    .eq('id', attemptId)
    .eq('student_id', (session as string).userId)
    .single();

  if (!attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
  }

  // Save CMI data
  const updates = [];
  for (const [key, value] of Object.entries(data)) {
    updates.push(
      supabase.from('scorm_cmi_data').upsert({
        attempt_id: attemptId,
        cmi_key: key,
        cmi_value: value as string,
      })
    );
  }

  await Promise.all(updates);

  // Update attempt status based on CMI data
  const status =
    data['cmi.core.lesson_status'] || data['cmi.completion_status'];
  const score = data['cmi.core.score.raw'] || data['cmi.score.raw'];

  if (status || score) {
    await supabase
      .from('scorm_attempts')
      .update({
        status,
        score_raw: score ? parseFloat(score) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptId);
  }

  return NextResponse.json({ ok: true });
}
export const GET = withApiAudit('/api/scorm/attempts/[attemptId]/data', _GET);
export const POST = withApiAudit('/api/scorm/attempts/[attemptId]/data', _POST);
