export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/enrollments/create
 * 
 * @deprecated Use /api/enrollments/create-enforced for program enrollments
 * 
 * This endpoint handles COURSE-ONLY enrollments (individual courses).
 * For PROGRAM enrollments (workforce, apprenticeships), use:
 * - /api/enroll/apply - Public application flow
 * - /api/enrollments/create-enforced - Authenticated with intake validation
 * 
 * Request body:
 * - courseId: string (required) - Course UUID
 * - fundingSource?: string - Funding source code
 * - idempotencyKey?: string - Prevent duplicate enrollments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const requestId = crypto.randomUUID();
  
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to enroll.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId, programId, fundingSource, idempotencyKey } = body;

    // Redirect program enrollments to enforced endpoint
    if (programId) {
      logger.warn('Deprecated: programId sent to /api/enrollments/create', { 
        userId: user.id, 
        programId,
        requestId 
      });
      return NextResponse.json(
        { 
          error: 'For program enrollments, use /api/enrollments/create-enforced or /api/enroll/apply',
          deprecated: true,
          redirectTo: '/api/enrollments/create-enforced'
        },
        { status: 400 }
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Idempotency check (graceful if table doesn't exist)
    if (idempotencyKey) {
      try {
        const { data: existingByKey } = await db
          .from('enrollment_idempotency')
          .select('enrollment_id, created_at')
          .eq('idempotency_key', idempotencyKey)
          .single();

        if (existingByKey) {
          logger.info('Idempotent enrollment request', { idempotencyKey, requestId });
          return NextResponse.json({
            success: true,
            enrollmentId: existingByKey.enrollment_id,
            idempotent: true,
          });
        }
      } catch (idempotencyError) {
        // Table might not exist yet - continue without idempotency
        logger.warn('Idempotency check failed (continuing):', { error: idempotencyError, requestId });
      }
    }

    // Validate course exists and is available — canonical courses table only
    const { data: course, error: courseError } = await db
      .from('courses')
      .select('id, title, status, is_active')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.status === 'archived' || !course.is_active) {
      return NextResponse.json(
        { error: 'Course is no longer available' },
        { status: 400 }
      );
    }

    if (course.status !== 'published') {
      return NextResponse.json(
        { error: 'Course is not published' },
        { status: 400 }
      );
    }

    // Resolve latest published version — students are locked to this forever
    const { data: courseVersion } = await db.rpc('get_latest_published_version', {
      p_course_id: courseId,
    });
    const courseVersionId: string | null = courseVersion?.id ?? null;

    // Check existing enrollment
    const { data: existing } = await db
      .from('program_enrollments')
      .select('user_id, course_id, status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({
          success: true,
          alreadyEnrolled: true,
          message: 'Already enrolled in this course',
        });
      }
      
      // Reactivate expired/withdrawn enrollment
      const { data: reactivated, error: reactivateError } = await db
        .from('program_enrollments')
        .update({ 
          status: 'active', 
          started_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .select()
        .single();

      if (reactivateError) {
        logger.error('Enrollment reactivation failed', reactivateError instanceof Error ? reactivateError : new Error(String(reactivateError)));
        return NextResponse.json(
          { error: 'Failed to reactivate enrollment' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        enrollment: reactivated,
        reactivated: true,
      });
    }

    // Create new enrollment — locked to current published version
    const { data: enrollment, error } = await db
      .from('program_enrollments')
      .insert({
        user_id:           user.id,
        course_id:         courseId,
        course_version_id: courseVersionId,
        status:            'active',
        progress_percent:  0,
        started_at:        new Date().toISOString(),
        enrollment_method: 'direct',
        funding_source:    fundingSource || null,
      })
      .select()
      .single();

    if (error) {
      logger.error('Enrollment creation failed', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Failed to create enrollment' },
        { status: 500 }
      );
    }

    // Record idempotency key if provided (graceful if table doesn't exist)
    if (idempotencyKey) {
      void Promise.resolve(
        db.from('enrollment_idempotency').insert({
          idempotency_key: idempotencyKey,
          enrollment_id: `${user.id}_${courseId}`,
          user_id: user.id,
        })
      ).then(() => {
        logger.info('Idempotency key recorded', { idempotencyKey, requestId });
      }).catch(() => {
        logger.warn('Failed to record idempotency key (table may not exist)');
      });
    }

    logger.info('Course enrollment created', {
      userId: user.id,
      courseId,
      requestId,
    });

    return NextResponse.json({
      success: true,
      enrollment,
    });

  } catch (error: any) {
    logger.error('Enrollment API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/enrollments/create', _POST as unknown as (req: Request, ...args: any[]) => Promise<Response>);
