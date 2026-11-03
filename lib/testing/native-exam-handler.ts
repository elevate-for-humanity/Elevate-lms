import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requiredSections, reportingPeriod, csvCell } from './native-exam-policy';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function identity() {
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;
  const db = await requireAdminClient();
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('id,role,tenant_id,is_active,suspended')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) throw new Error('Account lookup unavailable');
  if (!profile || profile.is_active === false || profile.suspended) return null;
  return { db, user, profile, platformAdmin: ['admin', 'super_admin'].includes(profile.role) };
}
export async function nativeExamPost(request: Request) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  try {
    const auth = await identity();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    let response;
    switch (body.action) {
      case 'start': {
        requiredSections(body.examType);
        if (
          !UUID.test(body.sessionId || '') ||
          typeof body.bankVersion !== 'string' ||
          typeof body.address !== 'string' ||
          typeof body.city !== 'string'
        )
          throw new Error('Session, bank version, address and city are required');
        response = await auth.db.rpc('epa_start_native_exam', {
          p_actor: auth.user.id,
          p_session: body.sessionId,
          p_exam_type: body.examType,
          p_bank_version: body.bankVersion,
          p_candidate_address: body.address,
          p_candidate_city: body.city,
          p_opt_out: body.directoryOptOut !== false,
        });
        break;
      }
      case 'submit': {
        if (
          !UUID.test(body.attemptId || '') ||
          !Array.isArray(body.answers) ||
          body.answers.length > 100 ||
          body.answers.some(
            (a: any) => !Number.isInteger(a.position) || !Number.isInteger(a.answer),
          )
        )
          throw new Error('Valid attempt and answer positions required');
        response = await auth.db.rpc('epa_submit_native_exam', {
          p_actor: auth.user.id,
          p_attempt: body.attemptId,
          p_answers: body.answers,
        });
        break;
      }
      case 'issue': {
        if (!UUID.test(body.attemptId || '')) throw new Error('Attempt required');
        response = await auth.db.rpc('epa_issue_native_certificate', {
          p_actor: auth.user.id,
          p_attempt: body.attemptId,
        });
        break;
      }
      case 'import-bank': {
        if (!auth.platformAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        response = await auth.db.rpc('epa_import_question_bank', {
          p_actor: auth.user.id,
          p_version: body.bankVersion,
          p_questions: body.questions,
        });
        break;
      }
      case 'register-proctor': {
        if (!auth.platformAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (
          !UUID.test(body.userId || '') ||
          !body.siteName?.trim() ||
          !body.siteAddress?.trim() ||
          !['pending', 'active', 'suspended'].includes(body.status)
        )
          throw new Error('Proctor, site, address and valid status required');
        if (body.status === 'active' && !body.trainingVerified)
          throw new Error('Verify proctor training before activation');
        response = await auth.db
          .from('epa_proctor_registrations')
          .upsert(
            {
              user_id: body.userId,
              site_name: body.siteName.trim(),
              site_address: body.siteAddress.trim(),
              status: body.status,
              training_verified_at: body.trainingVerified ? new Date().toISOString() : null,
              approved_at: body.status === 'active' ? new Date().toISOString() : null,
              approved_by: body.status === 'active' ? auth.user.id : null,
            },
            { onConflict: 'user_id,site_name' },
          )
          .select('id,status')
          .single();
        break;
      }
      default:
        throw new Error('Unknown exam action');
    }
    if (response.error)
      return NextResponse.json({ error: response.error.message }, { status: 409 });
    return NextResponse.json({ data: response.data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Exam operation failed' },
      { status: 400 },
    );
  }
}
export async function nativeExamGet(request: Request) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await identity();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const id = params.get('attemptId');
  if (id) {
    if (!UUID.test(id))
      return NextResponse.json({ error: 'Valid attempt required' }, { status: 400 });
    const { data, error } = await auth.db.rpc('epa_native_exam_payload', {
      p_actor: auth.user.id,
      p_attempt: id,
    });
    return NextResponse.json(error ? { error: 'Exam unavailable' } : { data }, {
      status: error ? 403 : 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  if (!auth.platformAdmin && !['proctor', 'test_admin', 'staff'].includes(auth.profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (params.get('report') === 'epa') {
    if (!auth.platformAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    let period;
    try {
      period = reportingPeriod(Number(params.get('year')), Number(params.get('half')));
    } catch {
      return NextResponse.json({ error: 'Valid year and half required' }, { status: 400 });
    }
    const { data: report, error: reportError } = await auth.db.rpc('epa_native_activity_report', {
      p_start: period.start,
      p_end: period.end,
    });
    if (reportError)
      return NextResponse.json({ error: 'Complete report could not load' }, { status: 503 });
    const header = ['Exam Type', 'Attempts', 'Passed', 'Failed', 'Certificates Issued'];
    const lines = (report || []).map((row: any) => [
      row.exam_type,
      row.attempts,
      row.passed,
      row.failed,
      row.certified,
    ]);
    return new Response([header, ...lines].map((row) => row.map(csvCell).join(',')).join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="epa-six-month-report.csv"',
        'Cache-Control': 'no-store',
      },
    });
  }
  const { data, error } = await auth.db.rpc('epa_native_readiness');
  if (error)
    return NextResponse.json({ error: 'Certification readiness unavailable' }, { status: 503 });
  let attemptsQuery = auth.db
    .from('epa_native_attempts')
    .select('id,session_id,candidate_name,exam_type,submitted_at,passed,certificate_number')
    .order('started_at', { ascending: false })
    .limit(100);
  if (!auth.platformAdmin) {
    const ids = (data.proctors || [])
      .filter((p: any) => p.user_id === auth.user.id)
      .map((p: any) => p.id);
    attemptsQuery = attemptsQuery.in('proctor_registration_id', ids);
    data.proctors = (data.proctors || []).filter((p: any) => p.user_id === auth.user.id);
  }
  const { data: attempts, error: attemptsError } = await attemptsQuery;
  if (attemptsError)
    return NextResponse.json({ error: 'Exam attempts unavailable' }, { status: 503 });
  return NextResponse.json(
    { data: { ...data, attempts, canManage: auth.platformAdmin } },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
