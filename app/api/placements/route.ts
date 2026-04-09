// GET  /api/placements  — list placements (admin/staff/case_manager/provider_admin)
// POST /api/placements  — create a placement record (admin/staff/case_manager)
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAuditEvent, AuditActions } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard();

  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const learner_id  = searchParams.get('learner_id');
  const employer_id = searchParams.get('employer_id');
  const program_id  = searchParams.get('program_id');
  const status      = searchParams.get('status');
  const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const perPage     = Math.min(100, parseInt(searchParams.get('per_page') ?? '25'));
  const offset      = (page - 1) * perPage;

  let query = db
    .from('placement_records')
    .select(`
      id, hire_date, job_title, employment_type, hourly_wage, annual_salary,
      verification_source, verified_at, status, employed_q2, employed_q4,
      median_earnings_q2, tenant_id, created_at,
      learner:profiles!learner_id(id, full_name, email),
      employer:employers!employer_id(id, business_name),
      program:programs!program_id(id, title)
    `, { count: 'exact' })
    .order('hire_date', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (learner_id)  query = query.eq('learner_id', learner_id);
  if (employer_id) query = query.eq('employer_id', employer_id);
  if (program_id)  query = query.eq('program_id', program_id);
  if (status)      query = query.eq('status', status);

  // Scope provider_admin to their tenant
  if (auth.role === 'provider_admin') {
    query = query.eq('tenant_id', (auth as any).profile?.tenant_id);
  }

  // Scope case_manager to assigned learners
  if (auth.role === 'case_manager') {
    const { data: assignments } = await db
      .from('case_manager_assignments')
      .select('learner_id')
      .eq('case_manager_id', auth.id);
    const ids = (assignments ?? []).map((a: any) => a.learner_id);
    if (ids.length === 0) return NextResponse.json({ placements: [], total: 0, page, per_page: perPage });
    query = query.in('learner_id', ids);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch placements' }, { status: 500 });

  return NextResponse.json({ placements: data ?? [], total: count ?? 0, page, per_page: perPage });
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard();

  const body = await req.json().catch(() => null);
  if (!body?.learner_id || !body?.hire_date || !body?.job_title) {
    return NextResponse.json({ error: 'learner_id, hire_date, and job_title are required' }, { status: 400 });
  }

  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  // Resolve tenant_id from learner's profile
  const { data: learner } = await db
    .from('profiles')
    .select('tenant_id')
    .eq('id', body.learner_id)
    .single();

  const { data: record, error } = await db
    .from('placement_records')
    .insert({
      learner_id:          body.learner_id,
      employer_id:         body.employer_id ?? null,
      program_id:          body.program_id ?? null,
      enrollment_id:       body.enrollment_id ?? null,
      hire_date:           body.hire_date,
      job_title:           body.job_title,
      employment_type:     body.employment_type ?? 'full_time',
      hourly_wage:         body.hourly_wage ?? null,
      annual_salary:       body.annual_salary ?? null,
      verification_source: body.verification_source ?? 'self_report',
      status:              'pending',
      tenant_id:           learner?.tenant_id ?? null,
      notes:               body.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create placement record' }, { status: 500 });

  await logAuditEvent({
    actor_user_id: auth.id,
    actor_role: auth.role ?? 'staff',
    action: AuditActions.CREATE,
    entity: 'placement_record',
    entity_id: record.id,
    after: record,
    req,
  });

  return NextResponse.json({ placement: record }, { status: 201 });
}
