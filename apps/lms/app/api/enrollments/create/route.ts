/**
 * POST /api/enrollments/create
 *
 * CANONICAL COURSE-ONLY ENROLLMENT ENDPOINT.
 *
 * This endpoint handles individual course enrollments. It intentionally does
 * not create workforce/apprenticeship program enrollments. Program enrollment
 * requires completed intake and a funding pathway and is owned by:
 * - /api/enrollments/create-enforced
 *
 * Request body:
 * - courseId: string (required) - Course UUID
 * - fundingSource?: string - Funding source code
 * - idempotencyKey?: string - Prevent duplicate enrollments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const requestId = crypto.randomUUID();

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to enroll.' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { courseId, programId, fundingSource, idempotencyKey } = body;

    if (programId) {
      logger.warn('Program enrollment sent to course-only endpoint', {
        userId: user.id,
        programId,
        requestId,
      });
      return NextResponse.json(
        {
          error: 'Program enrollments must use /api/enrollments/create-enforced',
          code: 'PROGRAM_ENROLLMENT_ROUTE_REQUIRED',
          canonicalRoute: '/api/enrollments/create-enforced',
        },
        { status: 400 },
      );
    }

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    if (idempotencyKey) {
      try {
        const { data: existingByKey } = await supabase
          .from('enrollment_idempotency')
          .select('enrollment_id, created_at')
          .eq('idempotency_key', idempotencyKey)
          .maybeSingle();

        if (existingByKey) {
          logger.info('Idempotent enrollment request', { idempotencyKey, requestId });
          return NextResponse.json({
            success: true,
            enrollmentId: existingByKey.enrollment_id,
            idempotent: true,
          });
        }
      } catch (idempotencyError) {
        logger.warn('Idempotency check failed (continuing):', {
          error: idempotencyError,
          requestId,
        });
      }
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, status, is_active')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.status === 'archived' || !course.is_active) {
      return NextResponse.json({ error: 'Course is no longer available' }, { status: 400 });
    }

    if (course.status !== 'published') {
      return NextResponse.json({ error: 'Course is not published' }, { status: 400 });
    }

    let courseVersionId: string | null = null;
    try {
      const { data: courseVersion } = await supabase.rpc('get_latest_published_version', {
        p_course_id: courseId,
      });
      courseVersionId = courseVersion?.id ?? null;
    } catch {
      // Backward-compatible fallback while all environments receive version RPC.
    }

    const { data: existing } = await supabase
      .from('program_enrollments')
      .select('user_id, course_id, status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({
          success: true,
          alreadyEnrolled: true,
          message: 'Already enrolled in this course',
        });
      }

      const { data: reactivated, error: reactivateError } = await supabase
        .from('program_enrollments')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .select()
        .maybeSingle();

      if (reactivateError) {
        logger.error(
          'Enrollment reactivation failed',
          reactivateError instanceof Error ? reactivateError : new Error(String(reactivateError)),
        );
        return NextResponse.json({ error: 'Failed to reactivate enrollment' }, { status: 500 });
      }

      return NextResponse.json({ success: true, enrollment: reactivated, reactivated: true });
    }

    const { data: enrollment, error } = await supabase
      .from('program_enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        course_version_id: courseVersionId,
        status: 'active',
        progress_percent: 0,
        started_at: new Date().toISOString(),
        enrollment_method: 'direct',
        funding_source: fundingSource || null,
      })
      .select()
      .maybeSingle();

    if (error) {
      logger.error(
        'Enrollment creation failed',
        error instanceof Error ? error : new Error(String(error)),
      );
      return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
    }

    if (idempotencyKey) {
      void Promise.resolve(
        supabase.from('enrollment_idempotency').insert({
          idempotency_key: idempotencyKey,
          enrollment_id: enrollment?.id || `${user.id}_${courseId}`,
          user_id: user.id,
        }),
      )
        .then(() => logger.info('Idempotency key recorded', { idempotencyKey, requestId }))
        .catch(() => logger.warn('Failed to record idempotency key (table may not exist)'));
    }

    logger.info('Course enrollment created', { userId: user.id, courseId, requestId });

    return NextResponse.json({ success: true, enrollment });
  } catch (error: any) {
    logger.error('Enrollment API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit(
  '/api/enrollments/create',
  _POST as unknown as (req: Request, ...args: any[]) => Promise<Response>,
);
