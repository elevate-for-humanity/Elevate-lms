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
  let query = auth.db.from('cmi_progress').select('*, cmi_enrollments (id, program_id, course_id, status, programs (id, name), courses (id, title))');
  if (studentId) query = query.eq('student_id', studentId);
  if (enrollmentId) query = query.eq('enrollment_id', enrollmentId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireCmiOperator();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { enrollment_id, student_id, total_lessons, completed_lessons, overall_pct, total_seat_time } = body;
  if (!enrollment_id || !student_id) return NextResponse.json({ error: 'enrollment_id and student_id required' }, { status: 400 });
  const { data, error } = await auth.db.from('cmi_progress').upsert({ enrollment_id, student_id, total_lessons, completed_lessons, overall_pct, total_seat_time, last_activity: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single();
  if (error) return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  return NextResponse.json(data);
}
