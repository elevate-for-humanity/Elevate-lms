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
  const date = searchParams.get('date');
  let query = auth.db.from('cmi_attendance').select('*, cmi_students (id, user_id, cohort)').order('date', { ascending: false });
  if (studentId) query = query.eq('student_id', studentId);
  if (date) query = query.eq('date', date);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireCmiOperator();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { student_id, date, present } = body;
  if (!student_id || !date) return NextResponse.json({ error: 'student_id and date required' }, { status: 400 });
  const { data, error } = await auth.db.from('cmi_attendance').upsert({ student_id, date, present: present ?? true }).select().single();
  if (error) return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  return NextResponse.json(data);
}
