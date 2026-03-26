
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'node:crypto';
import { getUserById } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

function makeSerial() {
  return `EFH-${randomBytes(4).toString('hex').toUpperCase()}`;
}

async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response('Unauthorized', { status: 401 });

  // Check role permissions
  const { data: prof } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!['admin', 'partner', 'instructor'].includes(prof?.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Use service role for certificate writes (RLS restricts inserts to admin)
  const adminDb = createAdminClient();

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
  if (!adminDb) {
    return new Response('Server configuration error', { status: 500 });
  }

  const { user_id, course_id, expires_at } = await req.json();

  if (!user_id || !course_id) {
    return new Response('Missing user_id or course_id', { status: 400 });
  }

  // Fetch course details for expiry calculation
  const { data: course } = await supabase
    .from('training_courses')
    .select('id, title, cert_valid_days')
    .eq('id', course_id)
    .maybeSingle();

  if (!course) {
    return new Response('Course not found', { status: 404 });
  }

  // Fetch user details using admin client
  let learner;
  try {
    learner = await getUserById(user_id);
  } catch (error) { 
    logger.error('Error fetching user:', error);
    return new Response('Failed to fetch user', { status: 500 });
  }

  // Mark enrollment as completed
  await supabase.from('program_enrollments').upsert({
    user_id,
    course_id,
    status: 'completed',
    completed_at: new Date().toISOString(),
  });

  // Get enrollment for funding program
  const { data: en } = await supabase
    .from('program_enrollments')
    .select('funding_program_id')
    .eq('user_id', user_id)
    .eq('course_id', course_id)
    .maybeSingle();

  // Log completion event for KPIs
  await supabase.from('enrollment_events').insert({
    user_id,
    course_id,
    funding_program_id: en?.funding_program_id || null,
    kind: 'COMPLETED',
  });

  // Calculate expiry date
  let expires_at_calc: string | null = null;
  if (expires_at) {
    expires_at_calc = new Date(expires_at).toISOString();
  } else if (course.cert_valid_days && Number(course.cert_valid_days) > 0) {
    const d = new Date();
    d.setDate(d.getDate() + Number(course.cert_valid_days));
    expires_at_calc = d.toISOString();
  }

  // Generate unique serial with retry logic
  let serial = makeSerial();
  let ok = false;
  let tries = 0;

  while (!ok && tries < 3) {
    const { error } = await adminDb.from('certificates').insert({
      user_id,
      course_id,
      serial,
      student_name: learner?.email?.split('@')[0] || 'Learner',
      course_name: course.course_name,
      completion_date: new Date().toISOString().split('T')[0],
      issued_at: new Date().toISOString(),
      expires_at: expires_at_calc,
    });

    if (!error) {
      ok = true;
    } else {
      serial = makeSerial();
      tries++;
    }
  }

  if (!ok) {
    return new Response('Failed to generate unique serial', { status: 500 });
  }

  // Log certification event
  await adminDb.from('enrollment_events').insert({
    user_id,
    course_id,
    funding_program_id: en?.funding_program_id || null,
    kind: 'CERTIFIED',
  });

  return Response.json({ ok: true, serial });
}
export const POST = withApiAudit('/api/cert/issue', _POST);
