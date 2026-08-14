import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  const status = searchParams.get('status');

  const supabase = await createClient();

  let query = supabase
    .from('cmi_enrollments')
    .select(`
      *,
      cmi_students (id, user_id, cohort, status),
      programs (id, name, slug),
      courses (id, title)
    `)
    .order('enrolled_at', { ascending: false });

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { student_id, program_id, course_id } = body;

  if (!student_id) {
    return NextResponse.json({ error: 'student_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('cmi_enrollments')
    .insert({
      student_id,
      program_id,
      course_id,
      enrolled_by: user.id,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
