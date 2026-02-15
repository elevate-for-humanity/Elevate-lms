export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'node:crypto';
import { getUserByEmail } from '@/lib/supabase-admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

function parseCSV(raw: string) {
  const lines = raw.trim().split(/\r?\n/);
  const head = lines.shift()!;
  const cols = head.split(',').map((s) => s.trim().toLowerCase());
  return lines.map((line) => {
    const vals = line.split(',').map((v) => v.trim());
    const row: any = {};
    cols.forEach((c, i) => (row[c] = vals[i] ?? ''));
    return row;
  });
}
function serial() {
  return `EFH-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  const { data: prof } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!['admin', 'partner'].includes(prof?.role))
    return new Response('Forbidden', { status: 403 });

  // Use service role for certificate/enrollment writes (RLS restricts inserts to admin)
  const adminDb = createAdminClient();
  if (!adminDb) {
    return new Response('Server configuration error', { status: 500 });
  }

  const raw = await req.text();
  const rows = parseCSV(raw);
  const errors: any[] = [];
  let issued = 0;

  for (const r of rows) {
    try {
      const email = r.email;
      if (!email) {
        errors.push({ row: r, err: 'Missing email' });
        continue;
      }

      // user - use admin client
      const u = await getUserByEmail(email);
      if (!u?.id) {
        errors.push({ row: r, err: 'User not found' });
        continue;
      }

      // course
      let course;
      if (r.course_id) {
        const { data }: any = await supabase
          .from('courses')
          .select('id,title,slug,cert_valid_days')
          .eq('id', r.course_id)
          .maybeSingle();
        course = data;
      } else if (r.course_slug) {
        const { data }: any = await supabase
          .from('courses')
          .select('id,title,slug,cert_valid_days')
          .eq('slug', r.course_slug)
          .maybeSingle();
        course = data;
      }
      if (!course?.id) {
        errors.push({ row: r, err: 'Course not found' });
        continue;
      }

      // mark enrollment completed (create if missing)
      await adminDb.from('enrollments').upsert({
        user_id: u.id,
        course_id: course.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      // KPI event
      const { data: en } = await supabase
        .from('enrollments')
        .select('funding_program_id')
        .eq('user_id', u.id)
        .eq('course_id', course.id)
        .maybeSingle();
      await adminDb.from('enrollment_events').insert({
        user_id: u.id,
        course_id: course.id,
        funding_program_id: en?.funding_program_id || null,
        kind: 'COMPLETED',
      });

      // expiry: priority = CSV expires_at → course.cert_valid_days → none
      let expires_at: string | null = null;
      if (r.expires_at) {
        expires_at = new Date(r.expires_at).toISOString();
      } else if (course.cert_valid_days && Number(course.cert_valid_days) > 0) {
        const d = new Date();
        d.setDate(d.getDate() + Number(course.cert_valid_days));
        expires_at = d.toISOString();
      }

      const issued_at = r.issued_at
        ? new Date(r.issued_at).toISOString()
        : new Date().toISOString();

      // issue cert (retry on collision)
      let s = serial();
      let ok = false;
      let tries = 0;
      while (!ok && tries < 3) {
        const { error } = await adminDb.from('certificates').insert({
          user_id: u.id,
          course_id: course.id,
          serial: s,
          student_name: u.email ? u.email.split('@')[0] : 'Unknown',
          course_name: course.title,
          completion_date: new Date(issued_at).toISOString().split('T')[0],
          issued_at,
          expires_at,
        });
        if (!error) ok = true;
        else {
          s = serial();
          tries++;
        }
      }
      if (!ok) {
        errors.push({ row: r, err: 'Serial issue failed' });
        continue;
      }

      // Log certification event
      await adminDb.from('enrollment_events').insert({
        user_id: u.id,
        course_id: course.id,
        funding_program_id: en?.funding_program_id || null,
        kind: 'CERTIFIED',
      });

      issued++;
    } catch (e: any) {
      errors.push({ row: r, err: e?.message || 'Unknown error' });
    }
  }

  return Response.json({ ok: true, issued, errors });
}
