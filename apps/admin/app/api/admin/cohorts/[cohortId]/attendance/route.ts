import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  const db = await requireAdminClient();
  if (!db) return { error: 'Admin client failed to initialize', status: 500 } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 } as const;
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['admin', 'sponsor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 } as const;
  }
  return { user, id: user.id, profile, db };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ cohortId: string }> }) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { cohortId } = await params;
  const sessionIds = (await auth.db.from('cohort_sessions').select('id').eq('cohort_id', cohortId)).data?.map((s) => s.id) || [];
  const { data, error } = await auth.db
    .from('cohort_attendance')
    .select('*, session:cohort_session_id(session_date, start_time, end_time, modality)')
    .in('cohort_session_id', sessionIds)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params: _params }: { params: Promise<{ cohortId: string }> }) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json();
  const { session_id, records } = body;
  if (!session_id || !Array.isArray(records)) {
    return NextResponse.json({ error: 'session_id and records[] required' }, { status: 400 });
  }
  const rows = records.map((r: any) => ({
    cohort_session_id: session_id,
    user_id: r.user_id,
    status: r.status || 'present',
    minutes_attended: r.minutes_attended || null,
    notes: r.notes || null,
    created_by: auth.id,
    updated_by: auth.id,
  }));
  const { data, error } = await auth.db
    .from('cohort_attendance')
    .upsert(rows, { onConflict: 'cohort_session_id,user_id' })
    .select();
  if (error) return NextResponse.json({ error: 'Failed to log attendance' }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
