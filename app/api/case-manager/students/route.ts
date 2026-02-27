import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await db
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'case_manager') {
      return NextResponse.json(
        { error: 'Forbidden - requires case_manager role' },
        { status: 403 }
      );
    }

    // Get students assigned to this case manager
    const { data: students, error } = await db
      .from('user_profiles')
      .select(
        `
        user_id,
        first_name,
        last_name,
        email,
        phone,
        created_at
      `
      )
      .eq('case_manager_id', user.id)
      .eq('role', 'student');

    if (error) {
      // Error: $1
      return NextResponse.json(
        { error: 'Failed to load students' },
        { status: 500 }
      );
    }

    // Get enrollment and hours data for each student
    const studentsWithData = await Promise.all(
      (students || []).map(async (student) => {
        // Get enrollments
        const { data: enrollments } = await db
          .from('program_enrollments')
          .select(
            `
            id,
            status,
            enrolled_at,
            programs(name, slug)
          `
          )
          .eq('student_id', student.user_id);

        // Get hours summary
        const { data: hours } = await db
          .from('apprenticeship_hours')
          .select('hours, approved')
          .eq('student_id', student.user_id);

        const totalHours =
          hours?.reduce((sum, h) => sum + parseFloat(h.hours || 0), 0) || 0;
        const approvedHours =
          hours
            ?.filter((h) => h.approved)
            .reduce((sum, h) => sum + parseFloat(h.hours || 0), 0) || 0;

        // Get exam readiness
        const { data: readiness } = await db
          .from('exam_readiness')
          .select('*')
          .eq('student_id', student.user_id)
          .single();

        return {
          ...student,
          enrollments: enrollments || [],
          hours: {
            total: totalHours,
            approved: approvedHours,
            pending: totalHours - approvedHours,
          },
          exam_readiness: readiness,
        };
      })
    );

    return NextResponse.json({ students: studentsWithData });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to load students' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/case-manager/students', _GET);
