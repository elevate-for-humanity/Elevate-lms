import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/auth';
import { checkMOUStatusServer } from '@/lib/mou-checks';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * POST /api/program-holder/enroll-participant
 * Enroll a participant into a program on behalf of a program holder.
 * Requires a fully executed MOU before enrollment is permitted.
 */
async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return safeError('Unauthorized', 401);
  }

  // Resolve program holder ID from profiles (canonical table)
  const db = await getAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['program_holder', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
    return safeError('Forbidden — program holder role required', 403);
  }

  // Resolve program holder record
  const { data: holder } = await db
    .from('program_holders')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!holder?.id && !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return safeError('No program holder record found for this user', 403);
  }

  const programHolderId = holder?.id ?? null;

  // MOU must be fully executed before enrollment
  if (programHolderId) {
    const mouStatus = await checkMOUStatusServer(supabase, programHolderId);
    if (!mouStatus.isValid) {
      return NextResponse.json(
        {
          error: 'MOU_NOT_EXECUTED',
          message: 'A fully executed MOU is required before enrolling participants.',
          currentStatus: mouStatus.status,
          requiresAction: true,
        },
        { status: 403 }
      );
    }
  }

  // Parse and validate request body
  let body: { participantEmail?: string; participantName?: string; programId?: string; fundingSource?: string };
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const { participantEmail, participantName, programId, fundingSource } = body;

  if (!participantEmail || !programId) {
    return safeError('participantEmail and programId are required', 400);
  }

  // Verify the program exists and is active
  const { data: program, error: programError } = await db
    .from('programs')
    .select('id, title, status')
    .eq('id', programId)
    .single();

  if (programError || !program) {
    return safeError('Program not found', 404);
  }

  if (program.status === 'archived') {
    return safeError('Cannot enroll into an archived program', 400);
  }

  // Check for existing enrollment to prevent duplicates
  const { data: existing } = await db
    .from('program_enrollments')
    .select('id, status')
    .eq('email', participantEmail.toLowerCase().trim())
    .eq('program_id', programId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'ALREADY_ENROLLED', message: 'Participant is already enrolled in this program', enrollmentId: existing.id },
      { status: 409 }
    );
  }

  // Create the enrollment record
  const { data: enrollment, error: enrollError } = await db
    .from('program_enrollments')
    .insert({
      email: participantEmail.toLowerCase().trim(),
      full_name: participantName ?? null,
      program_id: programId,
      program_holder_id: programHolderId,
      funding_source: fundingSource ?? 'program_holder',
      amount_paid_cents: 0,
      status: 'active',
      enrolled_at: new Date().toISOString(),
    })
    .select('id, status, enrolled_at')
    .single();

  if (enrollError) {
    return safeInternalError(enrollError, 'Failed to create enrollment');
  }

  return NextResponse.json({
    success: true,
    enrollmentId: enrollment.id,
    status: enrollment.status,
    enrolledAt: enrollment.enrolled_at,
    message: `${participantName ?? participantEmail} enrolled in ${program.title}`,
  });
}

export const POST = withApiAudit('/api/program-holder/enroll-participant', _POST);
