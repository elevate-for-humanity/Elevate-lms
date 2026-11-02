import { loadAssignedInstructorCourses } from '@/lib/lms/instructor-course-access';
import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get courses taught by this instructor
    const { data: courses, error: courseError } = await loadAssignedInstructorCourses(supabase, user.id, 'id, title');

    if (courseError) return NextResponse.json({error:'Assigned courses unavailable'}, {status:503});
    if (!courses || courses.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const courseIds = courses.map((c) => c.id);

    // Get enrollments for instructor's courses
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('student_id, course_id')
      .in('course_id', courseIds);

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const studentIds = [...new Set(enrollments.map((e) => e.student_id))];

    // Get student details
    const { data: students, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .in('id', studentIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ students: students || [] });
  } catch (err: any) {
    return NextResponse.json(
      {
        err: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
export const GET = withApiAudit('/api/instructor/my-students', _GET);
