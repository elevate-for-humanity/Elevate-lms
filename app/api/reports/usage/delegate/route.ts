import { createAdminClient } from '@/lib/supabase/admin';

import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: prof } = await supabase
    .from('user_profiles')
    .select('role, program_holder_id')
    .eq('user_id', user.id)
    .single();

  if (!prof?.program_holder_id) {
    return new Response('No program holder assigned', { status: 403 });
  }

  // Check if user is a delegate with view permissions
  const { data: del } = await supabase
    .from('delegates')
    .select('can_view_reports')
    .eq('user_id', user.id)
    .eq('program_holder_id', prof.program_holder_id)
    .maybeSingle();

  if (!del?.can_view_reports && prof.role !== 'partner') {
    return new Response('Forbidden', { status: 403 });
  }

  // Get enrollments for courses belonging to this program holder
  const { data: enrolls, error } = await supabase
    .from('program_enrollments')
    .select(
      `
      user_id,
      course_id,
      status,
      started_at,
      user:user_id(email),
      course:course_id(title, program_holder_id)
    `
    )
    .eq('course.program_holder_id', prof.program_holder_id);

  if (error) return new Response(toErrorMessage(error), { status: 500 });

  // Get user IDs for notes lookup
  const key = (u: string, c: string) => `${u}:${c}`;
  const userIds = Array.from(
    new Set((enrolls || []).map((e: Record<string, any>) => e.user_id))
  ).filter(Boolean);

  // Get latest notes for these learners
  const latestMap: Record<
    string,
    {
      status: string | null;
      note: string | null;
      created_at: string;
      follow_up_date: string | null;
      follow_up_done: boolean;
    }
  > = {};
  if (userIds.length) {
    const { data: notes } = await supabase
      .from('program_holder_notes')
      .select(
        'user_id, course_id, status, note, created_at, follow_up_date, follow_up_done'
      )
      .eq('program_holder_id', prof.program_holder_id)
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    for (const n of notes || []) {
      const k = key(n.user_id, n.course_id);
      if (!latestMap[k]) {
        latestMap[k] = {
          status: n.status,
          note: n.note,
          created_at: n.created_at,
          follow_up_date: n.follow_up_date,
          follow_up_done: n.follow_up_done ?? false,
        };
      }
    }
  }

  // Build rows
  const rows = (enrolls || []).map((e: Record<string, any>) => {
    const k = key(e.user_id, e.course_id);
    const latest = latestMap[k];

    return {
      user_id: e.user_id,
      course_id: e.course_id,
      learner: (e.user?.email || '').split('@')[0],
      email: e.user?.email,
      course: e.course?.title,
      status: e.status,
      last_status: latest?.status || null,
      last_note: latest?.note || null,
      last_note_at: latest?.created_at || null,
      follow_up_date: latest?.follow_up_date || null,
      follow_up_done: latest?.follow_up_done ?? false,
    };
  });

  return Response.json(rows);
}
export const GET = withApiAudit('/api/reports/usage/delegate', _GET);
