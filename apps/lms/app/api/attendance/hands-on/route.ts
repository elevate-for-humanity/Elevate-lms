import { NextRequest, NextResponse } from 'next/server';
import { LMS_HOST } from '@/lib/routing/portal-map';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export async function GET() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to record attendance.' }, { status: 401 });
  const db = await requireAdminClient();
  const [enrollments, sessions] = await Promise.all([
    db
      .from('program_enrollments')
      .select('id,program_slug')
      .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
      .in('program_slug', ['hvac-technician', 'hvac', 'hvac-epa-608'])
      .in('status', ['active', 'enrolled', 'in_progress', 'confirmed'])
      .is('revoked_at', null)
      .is('suspended_at', null)
      .is('cancelled_at', null),
    db
      .from('hvac_hands_on_sessions')
      .select('id,enrollment_id,clock_in_at,clock_out_at,attendance_hours(verified)')
      .eq('user_id', user.id)
      .order('clock_in_at', { ascending: false })
      .limit(50),
  ]);
  if (enrollments.error || sessions.error)
    return NextResponse.json(
      { error: 'Attendance is temporarily unavailable. Contact support.' },
      { status: 503 },
    );
  return NextResponse.json(
    { enrollments: enrollments.data, sessions: sessions.data },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  // Cloud Run's internal request origin can differ from the public LMS origin.
  // Trust the configured portal, never caller-supplied forwarding headers.
  const expectedOrigin = new URL(LMS_HOST).origin;
  const localDevelopment =
    process.env.NODE_ENV !== 'production' && origin === request.nextUrl.origin;
  if (!origin || (origin !== expectedOrigin && !localDevelopment))
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to record attendance.' }, { status: 401 });
  let body: { action?: string; enrollment_id?: string; attested?: boolean };
  try {
    body = await request.json();
    if (!body || typeof body !== 'object') throw new Error('Invalid request');
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (
    typeof body.action !== 'string' ||
    !['clock_in', 'clock_out'].includes(body.action) ||
    typeof body.enrollment_id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.enrollment_id)
  )
    return NextResponse.json(
      { error: 'Select an enrollment and a valid action.' },
      { status: 400 },
    );
  const db = await requireAdminClient();
  const { data, error } = await db.rpc('record_hvac_hands_on', {
    p_user_id: user.id,
    p_enrollment_id: body.enrollment_id,
    p_action: body.action,
    p_attested: body.attested === true,
  });
  if (error)
    return NextResponse.json(
      {
        error:
          error.code === '42501'
            ? 'An active HVAC enrollment is required.'
            : 'The session could not be saved. Refresh Attendance or contact support.',
      },
      { status: error.code === '42501' ? 403 : 409 },
    );
  return NextResponse.json({ session: data });
}
