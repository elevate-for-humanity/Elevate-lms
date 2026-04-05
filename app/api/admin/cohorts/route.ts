import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user, profile, supabase };
}

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const programId = searchParams.get('program_id');

    let query = auth.supabase
      .from('cohorts')
      .select(`
        *,
        programs:program_id(id, title, slug),
        instructor:instructor_id(id, full_name, email),
        enrollments:enrollments(count)
      `)
      .order('start_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (programId) {
      query = query.eq('program_id', programId);
    }

    const { data: cohorts, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ cohorts: cohorts || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  
  try {
    const body = await request.json();
    
    const { data: cohort, error } = await auth.supabase
      .from('cohorts')
      .insert({
        program_id: body.program_id,
        program_slug: body.program_slug || null,
        code: body.code,
        name: body.name,
        cohort_name: body.cohort_name || body.name,
        start_date: body.start_date,
        end_date: body.end_date,
        cohort_start_date: body.cohort_start_date || body.start_date,
        cohort_end_date: body.cohort_end_date || body.end_date,
        planned_end_date: body.planned_end_date || null,
        max_capacity: body.max_capacity || 20,
        max_enrollment: body.max_enrollment || body.max_capacity || null,
        status: body.status || 'planned',
        location: body.location,
        instructor_id: body.instructor_id,
        notes: body.notes,
        // Workforce scheduling metadata
        partner_name: body.partner_name || null,
        partner_id: body.partner_id || null,
        duration_weeks_min: body.duration_weeks_min || null,
        duration_weeks_max: body.duration_weeks_max || null,
        delivery_window_text: body.delivery_window_text || null,
        session_length_minutes_default: body.session_length_minutes_default || 180,
        sessions_per_week_min: body.sessions_per_week_min || null,
        sessions_per_week_max: body.sessions_per_week_max || null,
        funding_streams: body.funding_streams || [],
        reporting_notes: body.reporting_notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Log audit
    await auth.supabase.from('audit_logs').insert({
      actor_id: auth.id,
      actor_role: auth.profile.role,
      action: 'create',
      resource_type: 'cohort',
      resource_id: cohort.id,
      after_state: cohort,
    });

    return NextResponse.json({ cohort }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _PATCH(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    }

    // Get current state for audit
    const { data: oldCohort } = await auth.supabase
      .from('cohorts')
      .select('*')
      .eq('id', id)
      .single();

    const { data: cohort, error } = await auth.supabase
      .from('cohorts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Log audit
    await auth.supabase.from('audit_logs').insert({
      actor_id: auth.id,
      actor_role: auth.profile.role,
      action: 'update',
      resource_type: 'cohort',
      resource_id: id,
      before_state: oldCohort,
      after_state: cohort,
    });

    return NextResponse.json({ cohort });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _DELETE(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
    }

    // Get current state for audit
    const { data: oldCohort } = await auth.supabase
      .from('cohorts')
      .select('*')
      .eq('id', id)
      .single();

    // Soft delete by setting status to cancelled
    const { error } = await auth.supabase
      .from('cohorts')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Log audit
    await auth.supabase.from('audit_logs').insert({
      actor_id: auth.id,
      actor_role: auth.profile.role,
      action: 'delete',
      resource_type: 'cohort',
      resource_id: id,
      before_state: oldCohort,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/cohorts', _GET);
export const POST = withApiAudit('/api/admin/cohorts', _POST);
export const PATCH = withApiAudit('/api/admin/cohorts', _PATCH);
export const DELETE = withApiAudit('/api/admin/cohorts', _DELETE);
