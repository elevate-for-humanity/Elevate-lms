
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'Admin client failed to initialize' }, { status: 500 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'sponsor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user, profile, db };
}

// GET — list sessions for a cohort
export async function GET(req: NextRequest, { params }: { params: Promise<{ cohortId: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { cohortId } = await params;

  const { data, error } = await auth.db
    .from('cohort_sessions')
    .select('*')
    .eq('cohort_id', cohortId)
    .order('session_date', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create a session
export async function POST(req: NextRequest, { params }: { params: Promise<{ cohortId: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { cohortId } = await params;
  const body = await req.json();

  const { data, error } = await auth.db
    .from('cohort_sessions')
    .insert({
      cohort_id: cohortId,
      session_date: body.session_date,
      start_time: body.start_time || '17:30',
      end_time: body.end_time || '20:30',
      duration_minutes: body.duration_minutes || 180,
      delivered_minutes: body.delivered_minutes || null,
      modality: body.modality || 'hybrid',
      location: body.location || null,
      instructor_name: body.instructor_name || null,
      notes: body.notes || null,
      created_by: auth.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
