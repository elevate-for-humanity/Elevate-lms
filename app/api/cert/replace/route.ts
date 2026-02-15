import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'node:crypto';
import { applyRateLimit } from '@/lib/api/withRateLimit';

function newSerial() {
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
  if (!['admin', 'partner', 'instructor'].includes(prof?.role))
    return new Response('Forbidden', { status: 403 });

  // Use service role for certificate writes (RLS restricts inserts to admin)
  const adminDb = createAdminClient();
  if (!adminDb) {
    return new Response('Server configuration error', { status: 500 });
  }

  const { old_serial, reason } = await req.json();
  if (!old_serial) return new Response('Missing serial', { status: 400 });

  const { data: old } = await supabase
    .from('certificates')
    .select('user_id, course_id, student_name, course_name')
    .eq('serial', old_serial)
    .maybeSingle();
  if (!old) return new Response('Not found', { status: 404 });

  // revoke old
  await adminDb
    .from('certificates')
    .update({
      revoked_at: new Date().toISOString(),
      revoked_reason: reason || 'Replaced with new certificate',
    })
    .eq('serial', old_serial);

  // issue new
  const serial = newSerial();
  await adminDb.from('certificates').insert({
    user_id: old.user_id,
    course_id: old.course_id,
    serial,
    student_name: old.student_name,
    course_name: old.course_name,
    completion_date: new Date().toISOString().split('T')[0],
    issued_at: new Date().toISOString(),
  });

  // Log certification event
  const { data: en } = await supabase
    .from('enrollments')
    .select('funding_program_id')
    .eq('user_id', old.user_id)
    .eq('course_id', old.course_id)
    .maybeSingle();

  await adminDb.from('enrollment_events').insert({
    user_id: old.user_id,
    course_id: old.course_id,
    funding_program_id: en?.funding_program_id || null,
    kind: 'CERTIFIED',
  });

  return Response.json({ ok: true, new_serial: serial });
}
