import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sanitizeSearchInput } from '@/lib/utils';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
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

    // Use admin client — profiles RLS blocks user-scoped queries for other users
    const db = await requireAdminClient();

    let query = db
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search);
      query = query.or(`full_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`) as typeof query;
    }

    const { data: students, error, count } = await query;

    if (error) {
      logger.error('[/api/admin/students] DB error', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    let filteredStudents = students || [];

    // profiles has no PostgREST FK to enrollments — filter via training_enrollments separately
    if (status || programId) {
      const studentIds = filteredStudents.map((s) => s.id);
      if (studentIds.length > 0) {
        let enrollQuery = db
          .from('training_enrollments')
          .select('id, user_id, status, program_id, cohort_id, hours_completed')
          .in('user_id', studentIds);
        if (status) enrollQuery = enrollQuery.eq('status', status) as typeof enrollQuery;
        if (programId) enrollQuery = enrollQuery.eq('program_id', programId) as typeof enrollQuery;
        const { data: enrollments } = await enrollQuery;
        const matchedIds = new Set((enrollments || []).map((e: any) => e.user_id));
        filteredStudents = filteredStudents.filter((s) => matchedIds.has(s.id));
      }
    }

    return NextResponse.json({
      students: filteredStudents,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    logger.error('[/api/admin/students] Unexpected error', error);
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
    const db = await requireAdminClient();

    const { data: student, error } = await db
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
      .maybeSingle();

    if (error) {
      logger.error('[/api/admin/students POST] DB error', error);
      return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
    }

    // Log audit — fire and forget
    db.from('audit_logs').insert({
      actor_id: auth.id,
      actor_role: auth.profile.role,
      action: 'create',
      resource_type: 'student',
      resource_id: student?.id,
      after_state: student,
    }).catch(() => {});

    return NextResponse.json({ student }, { status: 201 });
  } catch (error: any) {
    logger.error('[/api/admin/students POST] Unexpected error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/students', _GET);
export const POST = withApiAudit('/api/admin/students', _POST);
