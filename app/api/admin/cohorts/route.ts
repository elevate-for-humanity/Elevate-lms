import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) return { error: 'Database unavailable', status: 500 };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user, profile, supabase };
}

export async function GET(request: Request) {
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

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  
  try {
    const body = await request.json();
    
    const { data: cohort, error } = await auth.supabase
      .from('cohorts')
      .insert({
        program_id: body.program_id,
        code: body.code,
        name: body.name,
        start_date: body.start_date,
        end_date: body.end_date,
        max_capacity: body.max_capacity || 20,
        status: body.status || 'planned',
        location: body.location,
        instructor_id: body.instructor_id,
        notes: body.notes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Log audit
    await auth.supabase.from('audit_logs').insert({
      actor_id: auth.user.id,
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

export async function PATCH(request: Request) {
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
      actor_id: auth.user.id,
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

export async function DELETE(request: Request) {
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
      actor_id: auth.user.id,
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
