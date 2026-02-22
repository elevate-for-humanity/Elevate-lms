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

  if (prof?.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const url = new URL(req.url);
  const program = (url.searchParams.get('program') || '').toUpperCase();
  const caseStatus = url.searchParams.get('status') || '';
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const format = (url.searchParams.get('format') || 'json').toLowerCase();

  // Build query for enrollments
  let query = db.from('enrollments').select(`
      user_id,
      course_id,
      status,
      started_at,
      funding_program_id,
      user:user_id(email),
      course:course_id(title),
      funding_program:funding_program_id(code)
    `);

  if (program) {
    // Filter by funding program code
    const { data: prog } = await db
      .from('funding_programs')
      .select('id')
      .eq('code', program)
      .maybeSingle();
    if (prog) {
      query = query.eq('funding_program_id', prog.id);
    }
  }

  if (from) query = query.gte('started_at', new Date(from).toISOString());
  if (to) query = query.lte('started_at', new Date(to).toISOString());

  const { data: enrolls, error } = await query;
  if (error) return new Response(toErrorMessage(error), { status: 500 });

  if (!enrolls || !enrolls.length) {
    if (format === 'csv') return new Response('', { status: 200 });
    return Response.json([]);
  }

  // Get latest notes per learner/course
  const key = (u: string, c: string) => `${u}:${c}`;
  const userIds = Array.from(
    new Set(enrolls.map((e: Record<string, any>) => e.user_id))
  ).filter(Boolean);

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
  let rows = enrolls.map((e: Record<string, any>) => {
    const k = key(e.user_id, e.course_id);
    const latest = latestMap[k];

    return {
      user_id: e.user_id,
      learner: (e.user?.email || '').split('@')[0],
      email: e.user?.email,
      course: e.course?.title,
      program_code: e.funding_program?.code || '',
      enroll_status: e.status,
      case_status: latest?.status || null,
      case_note: latest?.note || null,
      last_note_at: latest?.created_at || null,
      program_holder: latest?.ph_id ? phNames[latest.ph_id] || null : null,
    };
  });

  // Filter by case status if requested
  if (caseStatus) {
    const target = caseStatus.toLowerCase();
    rows = rows.filter((r) => (r.case_status || '').toLowerCase() === target);
  }

  // Return CSV format if requested
  if (format === 'csv') {
    const header =
      'participant_email,training_track,funding_program,training_status,case_status,most_recent_case_note,last_note_at,training_provider\n';
    const lines = rows
      .map((r) =>
        [
          r.email,
          r.course,
          r.program_code,
          r.enroll_status === 'completed'
            ? 'Completed'
            : r.enroll_status === 'active'
              ? 'Active'
              : r.enroll_status === 'dropped'
                ? 'Withdrawn'
                : r.enroll_status,
          r.case_status === 'Behind'
            ? 'At Risk'
            : r.case_status === 'Dropped'
              ? 'Not Engaged'
              : r.case_status || '',
          r.case_note || '',
          r.last_note_at || '',
          r.program_holder || '',
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
        'Content-Disposition': `attachment; filename="caseload_${date}.csv"`,
      },
    });
  }

  return Response.json(rows);
}
