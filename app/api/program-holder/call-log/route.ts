import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// POST — save a call log entry
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { program_holder_student_id, outcome, notes, next_follow_up, work_start_date, work_site } = body;
  if (!program_holder_student_id) return NextResponse.json({ error: 'Missing student id' }, { status: 400 });

  const db = await requireAdminClient();

  // Verify caller owns this student record
  const { data: student } = await db
    .from('program_holder_students')
    .select('id, program_holder_id')
    .eq('id', program_holder_student_id)
    .single();
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: holder } = await db
    .from('program_holders')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!holder || holder.id !== student.program_holder_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Insert call log entry
  const { data: log, error } = await db
    .from('program_holder_call_log')
    .insert({
      program_holder_student_id,
      program_holder_id: holder.id,
      called_by_user_id: user.id,
      outcome,
      notes,
      next_follow_up: next_follow_up || null,
      work_start_date: work_start_date || null,
      work_site: work_site || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

  // Update summary fields on the student record
  await db.from('program_holder_students').update({
    call_notes: notes,
    call_date: new Date().toISOString(),
    call_outcome: outcome,
    work_start_date: work_start_date || null,
    work_site: work_site || null,
    work_progress: outcome === 'enrolled' ? 'enrolled' : outcome === 'not_interested' ? 'declined' : 'in_contact',
  }).eq('id', program_holder_student_id);

  return NextResponse.json({ success: true, log });
}

// GET — fetch call log for a student
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const studentId = request.nextUrl.searchParams.get('student_id');
  if (!studentId) return NextResponse.json({ error: 'Missing student_id' }, { status: 400 });

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('program_holder_call_log')
    .select('*')
    .eq('program_holder_student_id', studentId)
    .order('called_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  return NextResponse.json({ logs: data });
}
