import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  const enrollmentId = searchParams.get('enrollment_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  const supabase = await createClient();

  let query = supabase
    .from('cmi_seat_time')
    .select(`
      *,
      cmi_students (id, user_id, cohort),
      lessons (id, title)
    `)
    .order('date', { ascending: false });

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  if (enrollmentId) {
    query = query.eq('enrollment_id', enrollmentId);
  }

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
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

  const { enrollment_id, student_id, lesson_id, seconds_spent, started_at, ended_at } = body;

  if (!enrollment_id || !student_id) {
    return NextResponse.json({ error: 'enrollment_id and student_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('cmi_seat_time')
    .insert({
      enrollment_id,
      student_id,
      lesson_id,
      date: new Date().toISOString().split('T')[0],
      seconds_spent: seconds_spent ?? 0,
      started_at,
      ended_at
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }

  return NextResponse.json(data);
}
