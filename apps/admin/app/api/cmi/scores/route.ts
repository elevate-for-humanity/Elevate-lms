import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';

async function requireCmiOperator() {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = await requireAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin', 'org_admin', 'staff', 'advisor', 'instructor'].includes(profile.role)) return null;
  return { user, db };
}

export async function GET(request: Request) {
  const auth = await requireCmiOperator();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  const enrollmentId = searchParams.get('enrollment_id');
  const lessonId = searchParams.get('lesson_id');
  let query = auth.db.from('cmi_quiz_scores').select('*, cmi_students (id, user_id, cohort), lessons (id, title)').order('taken_at', { ascending: false });
  if (studentId) query = query.eq('student_id', studentId);
  if (enrollmentId) query = query.eq('enrollment_id', enrollmentId);
  if (lessonId) query = query.eq('lesson_id', lessonId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireCmiOperator();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { enrollment_id, student_id, lesson_id, quiz_id, score_raw, score_pct, passed, time_spent_secs } = body;
  if (!enrollment_id || !student_id) return NextResponse.json({ error: 'enrollment_id and student_id required' }, { status: 400 });
  const { data, error } = await auth.db.from('cmi_quiz_scores').insert({ enrollment_id, student_id, lesson_id, quiz_id, score_raw, score_pct, passed, time_spent_secs, passing_score: 70 }).select().single();
  if (error) return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  return NextResponse.json(data);
}
