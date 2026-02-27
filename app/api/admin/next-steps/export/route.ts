export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

function csvEscape(v: any) {
  const s = (v ?? '').toString().replace(/\r?\n/g, ' ').trim();
  if (s.includes(',') || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
  return s;
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

  const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
  const url = new URL(req.url);
  const status = (url.searchParams.get('status') || '').trim();
  const needs = (url.searchParams.get('needs') || '').trim();

  const { data: prof } = await adminClient
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

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
      profiles!student_next_steps_user_id_fkey ( full_name, email ),
      programs!student_next_steps_program_id_fkey ( name, slug )
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
    student_name: r.profiles?.full_name || '',
    student_email: r.profiles?.email || '',
    program_name: r.programs?.name || '',
    program_slug: r.programs?.slug || '',
  }));

  if (needs) {
    rows = rows.filter((r: any) => {
      if (needs === 'appt') return !r.workone_appointment_scheduled;
      if (needs === 'docs') return !r.advisor_docs_uploaded;
      if (needs === 'onboarding') return !r.efh_onboarding_call_completed;
      if (needs === 'start') return !r.program_start_confirmed;
      return true;
    });
  }

  const header = [
    'Student Name',
    'Student Email',
    'Program',
    'Program Slug',
    'Inquiry Submitted',
    'ICC Account Created',
    'WorkOne Appointment Scheduled',
    'WorkOne Appt Date',
    'WorkOne Appt Time',
    'WorkOne Location',
    'Told Advisor EFH',
    'Advisor Docs Uploaded',
    'Funding Status',
    'Funding Type',
    'EFH Onboarding Completed',
    'EFH Onboarding Date',
    'Program Start Confirmed',
    'Program Start Date',
    'Staff Notes',
    'Updated At',
  ];

  const lines = [
    header.join(','),
    ...rows.map((r: any) =>
      [
        r.student_name,
        r.student_email,
        r.program_name,
        r.program_slug,
        r.inquiry_submitted ? 'YES' : 'NO',
        r.icc_account_created ? 'YES' : 'NO',
        r.workone_appointment_scheduled ? 'YES' : 'NO',
        r.workone_appointment_date || '',
        r.workone_appointment_time || '',
        r.workone_location || '',
        r.told_advisor_efh ? 'YES' : 'NO',
        r.advisor_docs_uploaded ? 'YES' : 'NO',
        r.funding_status || 'pending',
        r.funding_type || '',
        r.efh_onboarding_call_completed ? 'YES' : 'NO',
        r.efh_onboarding_call_date || '',
        r.program_start_confirmed ? 'YES' : 'NO',
        r.program_start_date || '',
        r.staff_notes || '',
        r.updated_at || '',
      ]
        .map(csvEscape)
        .join(',')
    ),
  ];

  const csv = lines.join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="efh-workone-progress-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
export const GET = withApiAudit('/api/admin/next-steps/export', _GET);
