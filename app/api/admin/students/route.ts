import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeSearchInput } from '@/lib/utils';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
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
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = auth.supabase
      .from('profiles')
      .select(`
        *,
        enrollments:enrollments(
          id,
          status,
          program_id,
          cohort_id,
          hours_completed,
          programs:program_id(id, title)
        )
      `, { count: 'exact' })
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search);
      query = query.or(`full_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`);
    }

    const { data: students, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Filter by enrollment status/program if needed
    let filteredStudents = students || [];
    if (status || programId) {
      filteredStudents = filteredStudents.filter(student => {
        const enrollments = student.enrollments || [];
        return enrollments.some((e: any) => {
          if (status && e.status !== status) return false;
          if (programId && e.program_id !== programId) return false;
          return true;
        });
      });
    }

    return NextResponse.json({
      students: filteredStudents,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
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
    
    // Create profile for new student
    const { data: student, error } = await auth.supabase
      .from('profiles')
      .insert({
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        role: 'student',
        address: body.address,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
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
      resource_type: 'student',
      resource_id: student.id,
      after_state: student,
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/students', _GET);
export const POST = withApiAudit('/api/admin/students', _POST);
