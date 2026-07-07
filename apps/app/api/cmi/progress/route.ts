import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  const enrollmentId = searchParams.get('enrollment_id');

  const supabase = await createClient();

  let query = supabase
    .from('cmi_progress')
    .select(`
      *,
      cmi_enrollments (
        id,
        program_id,
        course_id,
        status,
        programs (id, name),
        courses (id, title)
      )
    `);

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  if (enrollmentId) {
    query = query.eq('enrollment_id', enrollmentId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { enrollment_id, student_id, total_lessons, completed_lessons, overall_pct, total_seat_time } = body;

  if (!enrollment_id || !student_id) {
    return NextResponse.json({ error: 'enrollment_id and student_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('cmi_progress')
    .upsert({
      enrollment_id,
      student_id,
      total_lessons,
      completed_lessons,
      overall_pct,
      total_seat_time,
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
