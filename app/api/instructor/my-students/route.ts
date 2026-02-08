import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
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
      .single();

    if (!profile || profile.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get courses taught by this instructor
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .eq('instructor_id', user.id);

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
        err:
          (err instanceof Error ? err.message : String(err)) ||
          'Failed to fetch students',
      },
      { status: 500 }
    );
  }
}
