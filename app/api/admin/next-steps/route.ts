
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

function progressFromRow(r: any) {
  const checks = [
    !!r.inquiry_submitted,
    !!r.icc_account_created,
    !!r.workone_appointment_scheduled,
    !!r.told_advisor_efh,
    !!r.advisor_docs_uploaded,
    r.funding_status === 'approved' || r.funding_status === 'denied',
    !!r.efh_onboarding_call_completed,
    !!r.program_start_confirmed,
  ];
  const done = checks.filter(Boolean).length;
  const total = checks.length;
  const percent = Math.round((done / total) * 100);
  return { done, total, percent };
}

async function _GET(req: Request) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: _roleProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!_roleProfile || !['admin', 'super_admin', 'staff'].includes(_roleProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const adminClient = await getAdminClient();

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const status = (url.searchParams.get('status') || '').trim();
  const needs = (url.searchParams.get('needs') || '').trim();

  // Get user's organization
  const { data: prof, error: profErr } = await adminClient
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profErr)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });

  const orgId = prof?.organization_id;
  if (!orgId)
    return NextResponse.json(
      { error: 'No active organization found' },
      { status: 400 }
    );

  let query = adminClient
    .from('student_next_steps')
    .select(
      `
      *,
      profiles!student_next_steps_user_id_fkey ( id, full_name, email ),
      programs!student_next_steps_program_id_fkey ( id, name, slug )
      `
    )
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false });

  if (status) query = query.eq('funding_status', status);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  let rows = (data || []).map((r: any) => ({
    ...r,
    progress: progressFromRow(r),
    student_name: r.profiles?.full_name || 'Student',
    student_email: r.profiles?.email || '',
    program_name: r.programs?.name || '',
    program_slug: r.programs?.slug || '',
  }));

  if (q) {
    const ql = q.toLowerCase();
    rows = rows.filter((r: any) =>
      `${r.student_name} ${r.student_email} ${r.program_name}`
        .toLowerCase()
        .includes(ql)
    );
  }

  if (needs) {
    rows = rows.filter((r: any) => {
      if (needs === 'appt') return !r.workone_appointment_scheduled;
      if (needs === 'docs') return !r.advisor_docs_uploaded;
      if (needs === 'onboarding') return !r.efh_onboarding_call_completed;
      if (needs === 'start') return !r.program_start_confirmed;
      return true;
    });
  }

  // Summary counts
  const summary = {
    total: rows.length,
    funding_pending: rows.filter((r: any) => r.funding_status === 'pending')
      .length,
    funding_approved: rows.filter((r: any) => r.funding_status === 'approved')
      .length,
    funding_denied: rows.filter((r: any) => r.funding_status === 'denied')
      .length,
    appt_missing: rows.filter((r: any) => !r.workone_appointment_scheduled)
      .length,
    onboarding_missing: rows.filter(
      (r: any) => !r.efh_onboarding_call_completed
    ).length,
    start_missing: rows.filter((r: any) => !r.program_start_confirmed).length,
  };

  return NextResponse.json({ org_id: orgId, summary, rows });
}
export const GET = withApiAudit('/api/admin/next-steps', _GET);
