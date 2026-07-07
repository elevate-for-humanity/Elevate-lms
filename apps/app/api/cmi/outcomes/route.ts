import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  const placedJob = searchParams.get('placed');

  const supabase = await createClient();

  let query = supabase
    .from('cmi_outcomes')
    .select(`
      *,
      cmi_students (
        id,
        user_id,
        cohort,
        applications (first_name, last_name, email)
      )
    `)
    .order('created_at', { ascending: false });

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  if (placedJob === 'true') {
    query = query.eq('placed_job', true);
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

  const { 
    student_id, 
    enrollment_id, 
    outcome_type, 
    outcome_value,
    credential_id,
    placed_job,
    job_title,
    employer,
    wages
  } = body;

  if (!student_id) {
    return NextResponse.json({ error: 'student_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('cmi_outcomes')
    .insert({
      student_id,
      enrollment_id,
      outcome_type,
      outcome_value,
      credential_id,
      issued_at: credential_id ? new Date().toISOString() : null,
      placed_job,
      job_title,
      employer,
      wages,
      placed_at: placed_job ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
