import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  const date = searchParams.get('date');

  const supabase = await createClient();

  let query = supabase
    .from('cmi_attendance')
    .select(`
      *,
      cmi_students (id, user_id, cohort)
    `)
    .order('date', { ascending: false });

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  if (date) {
    query = query.eq('date', date);
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

  const { student_id, date, present } = body;

  if (!student_id || !date) {
    return NextResponse.json({ error: 'student_id and date required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('cmi_attendance')
    .upsert({
      student_id,
      date,
      present: present ?? true
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
