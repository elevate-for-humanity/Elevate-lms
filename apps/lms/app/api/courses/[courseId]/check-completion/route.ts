import { logger } from '@/lib/logger';
// app/api/courses/[courseId]/check-completion/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ courseId: string }> };

async function _POST(req: NextRequest, { params }: Params) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { courseId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: enrollment, error: enrollError } = await supabase
    .from('program_enrollments')
    .select('*')
    .eq('program_id', courseId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (enrollError || !enrollment) {
    logger.error('Enroll error', enrollError);
    return NextResponse.json({ error: 'Enrollment not found for this course' }, { status: 404 });
  }

  if (!enrollment.internal_complete) {
    return NextResponse.json(
      {
        error: 'Internal course modules are not marked complete yet in the LMS.',
        code: 'INTERNAL_INCOMPLETE',
      },
      { status: 400 },
    );
  }

  const { data: extCheck, error: extError } = await supabase.rpc('external_modules_complete', {
    p_course_id: courseId,
    p_user_id: user.id,
  });

  if (extError) {
    logger.error('Extraction error', normalizeError(extError, 'Extraction error'), getErrorContext(extError));
    return NextResponse.json({ error: 'Error checking external modules' }, { status: 500 });
  }

  const externalOK = Boolean(extCheck);

  if (!externalOK) {
    const { data: summary } = await supabase.rpc('external_modules_summary', {
      p_course_id: courseId,
      p_user_id: user.id,
    });

    const pendingModules = summary?.[0]?.pending_modules || [];

    return NextResponse.json(
      {
        error: 'All required LMS modules are not approved yet.',
        code: 'EXTERNAL_INCOMPLETE',
        pending_modules: pendingModules,
      },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from('program_enrollments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', enrollment.id);

  if (updateError) {
    logger.error('Update error', updateError);
    return NextResponse.json({ error: 'Failed to set course as completed' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: 'Course marked as completed. All stacked credentials satisfied.',
  });
}

async function _GET(req: NextRequest, { params }: Params) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const supabase = await createClient();
  const { courseId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: status, error } = await supabase.rpc('check_course_completion', {
    p_course_id: courseId,
    p_user_id: user.id,
  });

  if (error) {
    logger.error('Course completion check failed', error);
    return NextResponse.json({ error: 'Error checking completion status' }, { status: 500 });
  }

  const { data: summary } = await supabase.rpc('external_modules_summary', {
    p_course_id: courseId,
    p_user_id: user.id,
  });

  return NextResponse.json({
    ...status?.[0],
    external_summary: summary?.[0],
  });
}
export const GET = withApiAudit('/api/courses/[courseId]/check-completion', _GET);
export const POST = withApiAudit('/api/courses/[courseId]/check-completion', _POST);
