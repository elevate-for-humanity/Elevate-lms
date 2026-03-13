
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/courses/[courseId]/check-completion/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

type Params = { params: Promise<{ courseId: string }> };

async function _POST(req: NextRequest, { params }: Params) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { courseId } = await params;

  // 1) Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 2) Get enrollment row (using program_id since that's what the table uses)
  const { data: enrollment, error: enrollError } = await supabase
    .from('program_enrollments')
    .select('*')
    .eq('program_id', courseId)
    .eq('user_id', user.id)
    .single();

  if (enrollError || !enrollment) {
    logger.error(enrollError);
    return NextResponse.json(
      { error: 'Enrollment not found for this course' },
      { status: 404 }
    );
  }

  // 3) Check internal completion flag
  if (!enrollment.internal_complete) {
    return NextResponse.json(
      {
        error:
          'Internal course modules are not marked complete yet in the LMS.',
        code: 'INTERNAL_INCOMPLETE',
      },
      { status: 400 }
    );
  }

  // 4) Call Postgres function to check external modules
  const { data: extCheck, error: extError } = await supabase.rpc(
    'external_modules_complete',
    {
      p_course_id: courseId,
      p_user_id: user.id,
    }
  );

  if (extError) {
    logger.error(extError);
    return NextResponse.json(
      { error: 'Error checking external modules' },
      { status: 500 }
    );
  }

  const externalOK = Boolean(extCheck);

  if (!externalOK) {
    // Get details about what's missing
    const { data: summary } = await supabase.rpc('external_modules_summary', {
      p_course_id: courseId,
      p_user_id: user.id,
    });

    const pendingModules = summary?.[0]?.pending_modules || [];

    return NextResponse.json(
      {
        error:
          'All required partner modules (e.g., Milady RISE) are not approved yet.',
        code: 'EXTERNAL_INCOMPLETE',
        pending_modules: pendingModules,
      },
      { status: 400 }
    );
  }

  // 5) If both internal + external are complete, mark course completed
  const { error: updateError } = await supabase
    .from('program_enrollments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', enrollment.id);

  if (updateError) {
    logger.error(updateError);
    return NextResponse.json(
      { error: 'Failed to set course as completed' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Course marked as completed. All stacked credentials satisfied.',
  });
}

// GET endpoint to check status without updating
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

  // Get completion status
  const { data: status, error } = await supabase.rpc(
    'check_course_completion',
    {
      p_course_id: courseId,
      p_user_id: user.id,
    }
  );

  if (error) {
    logger.error(error);
    return NextResponse.json(
      { error: 'Error checking completion status' },
      { status: 500 }
    );
  }

  // Get external module summary
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
