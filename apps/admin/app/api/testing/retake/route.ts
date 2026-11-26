/**
 * POST /api/testing/retake
 *
 * Issues a retake fee hold from the proctor portal (/proctor-portal
 * SessionRow). Creates an exam_enforcement_holds row of type
 * 'retake_fee' for the student, which blocks rebooking until staff
 * clear it once the retake fee is handled.
 *
 * Body: { bookingId, email, examName }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  const body = (await request.json().catch(() => ({}))) as {
    bookingId?: string;
    email?: string;
    examName?: string;
  };
  const email = body.email?.trim().toLowerCase();
  if (!email) return safeError('Student email is required', 400);

  const { data: student } = await db
    .from('profiles')
    .select('id, full_name, email')
    .eq('email', email)
    .maybeSingle();
  if (!student) return safeError('No student profile matches that email', 404);

  const { data: hold, error } = await db
    .from('exam_enforcement_holds')
    .insert({
      student_id: student.id,
      exam_session_id: body.bookingId && UUID_RE.test(body.bookingId) ? body.bookingId : null,
      hold_type: 'retake_fee',
      reason: `Retake fee hold issued from proctor portal${body.examName ? ` — ${body.examName}` : ''}`,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (error) return safeInternalError(error, 'Failed to issue retake hold');

  return NextResponse.json({ ok: true, hold_id: hold.id, student_id: student.id });
}
