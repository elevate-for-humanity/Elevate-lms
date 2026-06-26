/**
 * GET  /api/mentor/sessions
 * POST /api/mentor/sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { emitEvent } from '@/lib/platform/events';

const ALLOWED_ROLES = ['mentor', 'admin'];

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;
  if (!ALLOWED_ROLES.includes(auth.role ?? '')) return safeError('Forbidden', 403);

  const { searchParams } = req.nextUrl;
  const upcoming = searchParams.get('upcoming') === 'true';
  const limit = Math.min(50, Number(searchParams.get('limit') ?? 20));

  try {
    const supabase = await getAdminClient();
    let q = supabase
      .from('mentor_sessions')
      .select('id, scheduled_at, duration_minutes, status, notes, location, mentorship_id, session_type, topic')
      .order('scheduled_at', { ascending: upcoming })
      .limit(limit);

    if (upcoming) q = q.gte('scheduled_at', new Date().toISOString()) as typeof q;

    if (auth.role === 'mentor') {
      const { data: myMentorships } = await supabase.from('mentorships').select('id').eq('mentor_id', auth.id);
      const ids = (myMentorships ?? []).map((m: { id: string }) => m.id);
      if (ids.length === 0) return NextResponse.json({ sessions: [] });
      q = q.in('mentorship_id', ids) as typeof q;
    }

    const { data, error } = await q;
    if (error) return safeDbError(error, 'Failed to fetch sessions');
    return NextResponse.json({ sessions: data ?? [] });
  } catch (err) { return safeInternalError(err, 'Failed to fetch sessions'); }
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;
  if (!ALLOWED_ROLES.includes(auth.role ?? '')) return safeError('Forbidden', 403);

  try {
    const body = await req.json();
    const { mentorship_id, scheduled_at, duration_minutes = 60, notes, location, session_type = 'general', topic } = body;
    if (!scheduled_at) return safeError('scheduled_at is required', 400);

    const supabase = await getAdminClient();
    if (auth.role === 'mentor' && mentorship_id) {
      const { data: ms } = await supabase.from('mentorships').select('mentor_id').eq('id', mentorship_id).single();
      if (!ms || ms.mentor_id !== auth.id) return safeError('Forbidden', 403);
    }

    const { data, error } = await supabase
      .from('mentor_sessions')
      .insert({ mentorship_id: mentorship_id ?? null, scheduled_at, duration_minutes, notes, location, session_type, topic, status: 'scheduled' })
      .select('id, scheduled_at, duration_minutes, status')
      .single();

    if (error) return safeDbError(error, 'Failed to create session');

    await emitEvent('session.scheduled', 'lms', {
      actor_id: auth.id, actor_type: 'user',
      subject_id: data.id, subject_type: 'mentor_session',
      message: `Mentor session scheduled: ${new Date(scheduled_at).toLocaleDateString()}`,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (err) { return safeInternalError(err, 'Failed to create session'); }
}
