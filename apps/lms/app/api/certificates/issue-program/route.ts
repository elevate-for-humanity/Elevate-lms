import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await session
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile?.role || !['admin', 'super_admin', 'staff', 'instructor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { enrollment_id } = await request.json();
    if (!enrollment_id) {
      return NextResponse.json({ error: 'enrollment_id required' }, { status: 400 });
    }

    const db = await requireAdminClient();
    const { data: enrollment, error: enrollError } = await db
      .from('program_enrollments')
      .select('id,user_id,student_id,program_id,status')
      .eq('id', String(enrollment_id))
      .maybeSingle();
    if (enrollError || !enrollment?.program_id) {
      return NextResponse.json({ error: 'Program enrollment not found' }, { status: 404 });
    }

    const learnerId = enrollment.user_id || enrollment.student_id;
    if (!learnerId) {
      return NextResponse.json({ error: 'Enrollment has no learner' }, { status: 400 });
    }

    const { checkProgramReadiness, completeProgramEnrollment } =
      await import('@/lib/lms/completion-evaluator');
    const readiness = await checkProgramReadiness(enrollment.id, learnerId, enrollment.program_id);
    if (!readiness.ready) {
      return NextResponse.json(
        {
          error: 'Program completion requirements not met',
          blocking_reasons: readiness.missingRequirements,
        },
        { status: 400 },
      );
    }

    await completeProgramEnrollment(enrollment.id, learnerId, enrollment.program_id);
    const { data: certificate, error: certificateError } = await db
      .from('certificates')
      .select('id,certificate_number,verification_url,issued_at')
      .or(`student_id.eq.${learnerId},user_id.eq.${learnerId}`)
      .eq('program_id', enrollment.program_id)
      .is('course_id', null)
      .maybeSingle();
    if (certificateError) throw certificateError;
    if (!certificate) {
      return NextResponse.json({ error: 'Program certificate not found after issuance' }, { status: 500 });
    }

    return NextResponse.json({ success: true, certificate });
  } catch (error) {
    logger.error(
      'Certificate issuance error',
      normalizeError(error, 'Certificate issuance failed'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/certificates/issue-program', _POST);
