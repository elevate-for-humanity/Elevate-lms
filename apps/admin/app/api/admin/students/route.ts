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

  if (!user) return { error: 'Unauthorized' as const, status: 401 as const };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'super_admin', 'staff', 'org_admin'].includes(profile.role)) {
    return { error: 'Forbidden' as const, status: 403 as const };
  }

  return { user, profile };
}

async function handleGet(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const programId = searchParams.get('program_id');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const db = await requireAdminClient();

    let query = db
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search);
      query = query.or(
        `full_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`,
      ) as typeof query;
    }

    const { data: students, error, count } = await query;
    if (error) {
      logger.error('[/api/admin/students] DB error', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    let filteredStudents = students || [];

    if (status || programId) {
      const studentIds = filteredStudents.map((student) => student.id);
      if (studentIds.length > 0) {
        let enrollQuery = db
          .from('training_enrollments')
          .select('id, user_id, status, program_id, cohort_id, hours_completed')
          .in('user_id', studentIds);

        if (status) enrollQuery = enrollQuery.eq('status', status) as typeof enrollQuery;
        if (programId) enrollQuery = enrollQuery.eq('program_id', programId) as typeof enrollQuery;

        const { data: enrollments } = await enrollQuery;
        const matchedIds = new Set((enrollments || []).map((enrollment) => enrollment.user_id));
        filteredStudents = filteredStudents.filter((student) => matchedIds.has(student.id));
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
  } catch (error) {
    logger.error(
      '[/api/admin/students] Unexpected error',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/admin/students', handleGet);
