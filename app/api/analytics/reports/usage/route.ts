export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: prof } = await db
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (prof?.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const url = new URL(req.url);
  const code = (url.searchParams.get('code') || '').toUpperCase();
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const format = (url.searchParams.get('format') || 'json').toLowerCase();

  // Build query for enrollments
  let query = db.from('program_enrollments').select(`
      user_id,
      course_id,
      status,
      started_at,
      funding_program_id,
      user:user_id(email),
      course:course_id(title, program_holder_id),
      funding_program:funding_program_id(code)
    `);

  if (code) {
    // Filter by funding program code
    const { data: prog } = await db
      .from('funding_programs')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    if (prog) {
      query = query.eq('funding_program_id', prog.id);
    }
  }

  if (from) query = query.gte('started_at', new Date(from).toISOString());
  if (to) query = query.lte('started_at', new Date(to).toISOString());

  const { data: enrolls, error } = await query;
  if (error) return new Response(toErrorMessage(error), { status: 500 });

  // Get unique user IDs for login tracking
  const userIds = Array.from(
    new Set((enrolls || []).map((e: Record<string, any>) => e.user_id))
  ).filter(Boolean);

  // Get last login per user
  const lastLogins: Record<string, string | null> = {};
  if (userIds.length) {
    const { data: logs } = await db
      .from('login_events')
      .select('user_id, at')
      .in('user_id', userIds)
      .order('at', { ascending: false });

    for (const l of logs || []) {
      if (!lastLogins[l.user_id]) lastLogins[l.user_id] = l.at;
    }
  }

  // Get lesson progress for minutes calculation
  const progressMap: Record<string, { minutes: number; percent: number }> = {};
  if (userIds.length) {
    const { data: progress } = await db
      .from('lesson_progress')
      .select('user_id, lesson_id, last_position_seconds, percent')
      .in('user_id', userIds);

    for (const p of progress || []) {
      const key = p.user_id;
      if (!progressMap[key]) {
        progressMap[key] = { minutes: 0, percent: 0 };
      }
      progressMap[key].minutes += Math.floor(
        (p.last_position_seconds || 0) / 60
      );
      progressMap[key].percent = Math.max(
        progressMap[key].percent,
        p.percent || 0
      );
    }
  }

  // Get program holder notes
  const key = (u: string, c: string) => `${u}:${c}`;
  const latestMap: Record<
    string,
    {
      status: string | null;
      note: string | null;
      created_at: string;
      ph_id: string | null;
    }
  > = {};

  if (userIds.length) {
    const { data: notes } = await db
      .from('program_holder_notes')
      .select('user_id, course_id, status, note, created_at, program_holder_id')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    for (const n of notes || []) {
      const k = key(n.user_id, n.course_id);
      if (!latestMap[k]) {
        latestMap[k] = {
          status: n.status,
          note: n.note,
          created_at: n.created_at,
          ph_id: n.program_holder_id,
        };
      }
    }
  }

  // Get program holder names
  const phNames: Record<string, string> = {};
  const phIds = Array.from(
    new Set(
      Object.values(latestMap)
        .map((v) => v.ph_id)
        .filter(Boolean)
    )
  ) as string[];
  if (phIds.length) {
    const { data: phs } = await db
      .from('program_holders')
      .select('id, name')
      .in('id', phIds);
    for (const p of phs || []) {
      phNames[p.id] = p.name;
    }
  }

  // Build rows
  const rows = (enrolls || []).map((e: Record<string, any>) => {
    const k = key(e.user_id, e.course_id);
    const latest = latestMap[k];
    const prog = progressMap[e.user_id] || { minutes: 0, percent: 0 };

    return {
      learner: (e.user?.email || '').split('@')[0],
      email: e.user?.email,
      course: e.course?.title,
      start_date: e.started_at?.slice(0, 10),
      minutes: prog.minutes,
      percent: Math.round(prog.percent),
      status: e.status,
      last_login: lastLogins[e.user_id] || null,
      ph_name: latest?.ph_id ? phNames[latest.ph_id] || null : null,
      case_status: latest?.status || null,
      case_note: latest?.note || null,
    };
  });

  // Return CSV format if requested
  if (format === 'csv') {
    const header =
      'participant_email,training_track,start_date,training_minutes,course_progress_percent,training_status,last_lms_login,training_provider,case_status,most_recent_case_note\n';
    const lines = rows
      .map((r: Record<string, any>) =>
        [
          r.email,
          r.course,
          r.start_date,
          r.minutes,
          r.percent,
          r.status === 'completed'
            ? 'Completed'
            : r.status === 'active'
              ? 'Active'
              : r.status === 'dropped'
                ? 'Withdrawn'
                : r.status,
          r.last_login || '',
          r.ph_name || '',
          r.case_status === 'Behind'
            ? 'At Risk'
            : r.case_status === 'Dropped'
              ? 'Not Engaged'
              : r.case_status || '',
          r.case_note || '',
        ]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const date = new Date().toISOString().split('T')[0];
    return new Response(header + lines, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="usage_report_${date}.csv"`,
      },
    });
  }

  return Response.json(rows);
}
