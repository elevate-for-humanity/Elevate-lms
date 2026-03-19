import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Get course info
    const { data: course, error: courseError } = await db
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check enrollment
    const { data: enrollment, error: enrollmentError } = await db
      .from('training_enrollments')
      .select('id, status, progress')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Check if all lessons are completed
    const { data: lessons } = await db
      .from('course_lessons')
      .select('id')
      .eq('course_id', courseId);

    const { data: completedLessons } = await db
      .from('lesson_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('completed', true);

    const totalLessons = lessons?.length || 0;
    const completedCount = completedLessons?.length || 0;

    if (totalLessons > 0 && completedCount < totalLessons) {
      return NextResponse.json(
        {
          error: 'Not all lessons completed',
          completedLessons: completedCount,
          totalLessons,
          remainingLessons: totalLessons - completedCount,
        },
        { status: 400 }
      );
    }

    // Delegate to the canonical completion endpoint which enforces
    // quiz pass, proctored exam, and seat time gates.
    // This route only validates enrollment + lesson count as a pre-check.
    const { checkCourseCompletion } = await import('@/lib/course-completion');
    const { getCourseRequirements } = await import('@/lib/courses/completion-requirements');

    const completionStatus = await checkCourseCompletion(user.id, courseId);
    if (!completionStatus.isComplete) {
      return NextResponse.json({
        error: 'Course requirements not met',
        missingRequirements: completionStatus.missingRequirements,
      }, { status: 403 });
    }

    // Quiz pass verification
    if (!completionStatus.quizzesPassed && completionStatus.totalQuizzes > 0) {
      return NextResponse.json({
        error: 'Not all required quizzes have been passed',
        failedQuizzes: completionStatus.failedQuizTitles,
      }, { status: 403 });
    }

    // Proctored exam gate (course-specific)
    const { data: courseDetail } = await db
      .from('courses')
      .select('slug')
      .eq('id', courseId)
      .single();

    const requirements = getCourseRequirements(courseDetail?.slug || '');
    let examSession: any = null;

    if (requirements.examRequirement) {
      const { data: session } = await db
        .from('exam_sessions')
        .select('id, provider, result, score, proctor_id, completed_at')
        .eq('student_id', user.id)
        .eq('program_slug', courseDetail?.slug)
        .eq('result', requirements.examRequirement.requiredResult)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!session) {
        return NextResponse.json({
          error: `Proctored ${requirements.examRequirement.examName} exam must be passed before certificate issuance.`,
        }, { status: 403 });
      }
      examSession = session;
    }

    // Mark enrollment as completed
    const { error: updateError } = await db
      .from('training_enrollments')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollment.id);

    if (updateError) {
      logger.error('Course completion error:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete course' },
        { status: 500 }
      );
    }

    // Gather seat time
    const { data: seatTimeData } = await db
      .from('lesson_progress')
      .select('time_spent_seconds')
      .eq('user_id', user.id)
      .eq('course_id', courseId);
    const totalSeconds = (seatTimeData || []).reduce((s: number, r: any) => s + (r.time_spent_seconds || 0), 0);
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    // Seat time gate
    if (requirements.minimumSeatTimeHours && totalHours < requirements.minimumSeatTimeHours) {
      return NextResponse.json({
        error: 'Minimum seat time requirement not met',
        seatTimeRequirement: {
          required: requirements.minimumSeatTimeHours,
          recorded: totalHours,
          deficit: Math.round((requirements.minimumSeatTimeHours - totalHours) * 10) / 10,
        },
        message: `This course requires at least ${requirements.minimumSeatTimeHours} hours of instructional time. You have ${totalHours} hours recorded.`,
      }, { status: 403 });
    }

    // Issue certificate with full competency evidence
    let certificate = null;
    try {
      const { issueCertificate } = await import('@/lib/certificates/issue-certificate');
      const certResult = await issueCertificate({
        supabase,
        studentId: user.id,
        courseId,
        enrollmentId: enrollment.id,
        studentName: user.user_metadata?.full_name || user.email || 'Student',
        courseTitle: course.title,
        competencyEvidence: {
          seatTimeHours: totalHours,
          seatTimeSeconds: totalSeconds,
          examSessionId: examSession?.id || null,
          examProvider: examSession?.provider || null,
          examResult: examSession?.result || null,
          examScore: examSession?.score || null,
          examProctorId: examSession?.proctor_id || null,
          examDate: examSession?.completed_at || null,
          completionVerifiedAt: new Date().toISOString(),
          completionMethod: 'competency_verified',
        },
      });
      if (certResult.success && certResult.certificate) {
        certificate = certResult.certificate;
      }
    } catch (certErr) {
      logger.error('Certificate issuance error:', certErr);
    }

    // Get user profile for response
    const { data: profile } = await db
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      courseId,
      courseTitle: course.title,
      completedAt: new Date().toISOString(),
      certificate: certificate
        ? {
            id: certificate.id,
            certificateNumber: certificate.certificate_number,
            issuedAt: certificate.issued_at,
            verificationUrl: certificate.verification_url,
            downloadUrl: `/api/certificates/${certificate.id}/download`,
          }
        : null,
      student: profile
        ? {
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            email: profile.email,
          }
        : null,
    });
  } catch (error) {
    logger.error('Course complete API error:', error);
    return NextResponse.json(
      { error: 'Failed to complete course' },
      { status: 500 }
    );
  }
}

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Get completion status
    const { data: enrollment } = await db
      .from('training_enrollments')
      .select('status, progress, completed_at')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    const { data: lessons } = await db
      .from('course_lessons')
      .select('id')
      .eq('course_id', courseId);

    const { data: completedLessons } = await db
      .from('lesson_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('completed', true);

    const { data: certificate } = await db
      .from('certificates')
      .select('id, certificate_number, issued_at, verification_url')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    return NextResponse.json({
      courseId,
      enrolled: !!enrollment,
      status: enrollment?.status || 'not_enrolled',
      progress: enrollment?.progress || 0,
      completedAt: enrollment?.completed_at,
      lessonsCompleted: completedLessons?.length || 0,
      totalLessons: lessons?.length || 0,
      canComplete:
        (lessons?.length || 0) > 0 &&
        (completedLessons?.length || 0) === (lessons?.length || 0),
      certificate: certificate || null,
    });
  } catch (error) {
    logger.error('Course completion status error:', error);
    return NextResponse.json(
      { error: 'Failed to get completion status' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/courses/[courseId]/complete', _GET);
export const POST = withApiAudit('/api/courses/[courseId]/complete', _POST);
