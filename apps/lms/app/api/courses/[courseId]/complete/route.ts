import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { courseId } = await params;
    const supabase = await createClient();
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id,title,slug')
      .eq('id', courseId)
      .maybeSingle();
    if (courseError || !course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('program_enrollments')
      .select('id,status,progress_percent')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();
    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }

    const { checkCourseCompletion } = await import('@/lib/course-completion');
    const { getCourseRequirements } = await import('@/lib/courses/completion-requirements');
    const completionStatus = await checkCourseCompletion(user.id, courseId);
    if (!completionStatus.isComplete) {
      return NextResponse.json(
        { error: 'Course requirements not met', missingRequirements: completionStatus.missingRequirements },
        { status: 403 },
      );
    }

    const requirements = getCourseRequirements(course.slug || '');
    let examSession: any = null;
    if (requirements.examRequirement) {
      const { data: session } = await supabase
        .from('exam_sessions')
        .select('id,provider,result,score,proctor_id,completed_at')
        .eq('student_id', user.id)
        .eq('program_slug', course.slug)
        .eq('result', requirements.examRequirement.requiredResult)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!session) {
        return NextResponse.json(
          { error: `Proctored ${requirements.examRequirement.examName} exam must be passed before certificate issuance.` },
          { status: 403 },
        );
      }
      examSession = session;
    }

    const { data: seatTimeData, error: seatTimeError } = await supabase
      .from('lesson_progress')
      .select('time_spent_seconds')
      .eq('user_id', user.id)
      .eq('course_id', courseId);
    if (seatTimeError) throw seatTimeError;
    const totalSeconds = (seatTimeData ?? []).reduce(
      (sum: number, row: any) => sum + Math.max(0, row.time_spent_seconds || 0),
      0,
    );
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
    if (requirements.minimumSeatTimeHours && totalHours < requirements.minimumSeatTimeHours) {
      return NextResponse.json(
        {
          error: 'Minimum seat time requirement not met',
          seatTimeRequirement: {
            required: requirements.minimumSeatTimeHours,
            recorded: totalHours,
            deficit: Math.round((requirements.minimumSeatTimeHours - totalHours) * 10) / 10,
          },
        },
        { status: 403 },
      );
    }

    // All gates have passed. Mutate enrollment only now.
    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('program_enrollments')
      .update({
        status: 'completed',
        progress_percent: 100,
        completed_at: completedAt,
        updated_at: completedAt,
      })
      .eq('id', enrollment.id);
    if (updateError) {
      logger.error('Course completion enrollment update failed:', updateError);
      return NextResponse.json({ error: 'Failed to complete course' }, { status: 500 });
    }

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
          completionVerifiedAt: completedAt,
          completionMethod: 'competency_verified',
        },
      });
      if (certResult.success && certResult.certificate) certificate = certResult.certificate;
    } catch (certErr) {
      logger.error('Certificate issuance error:', certErr);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name,last_name,email')
      .eq('id', user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      courseId,
      courseTitle: course.title,
      completedAt,
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
        ? { name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(), email: profile.email }
        : null,
    });
  } catch (error) {
    logger.error('Course complete API error', normalizeError(error, 'Course complete error'), getErrorContext(error));
    return NextResponse.json({ error: 'Failed to complete course' }, { status: 500 });
  }
}

async function _GET(request: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { courseId } = await params;
    const supabase = await createClient();
    const [{ data: enrollment }, { data: lessons }, { data: completedLessons }, { data: certificate }] =
      await Promise.all([
        supabase
          .from('program_enrollments')
          .select('status,progress_percent,completed_at')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .maybeSingle(),
        supabase.from('course_lessons').select('id').eq('course_id', courseId),
        supabase
          .from('lesson_progress')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .eq('completed', true),
        supabase
          .from('certificates')
          .select('id,certificate_number,issued_at,verification_url')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .maybeSingle(),
      ]);

    const { checkCourseCompletion } = await import('@/lib/course-completion');
    const completion = enrollment ? await checkCourseCompletion(user.id, courseId) : null;
    return NextResponse.json({
      courseId,
      enrolled: Boolean(enrollment),
      status: enrollment?.status || 'not_enrolled',
      progress: enrollment?.progress_percent || 0,
      completedAt: enrollment?.completed_at,
      lessonsCompleted: completedLessons?.length || 0,
      totalLessons: lessons?.length || 0,
      canComplete: Boolean(completion?.isComplete),
      missingRequirements: completion?.missingRequirements ?? [],
      certificate: certificate || null,
    });
  } catch (error) {
    logger.error('Course completion status error', normalizeError(error, 'Completion status error'), getErrorContext(error));
    return NextResponse.json({ error: 'Failed to get completion status' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/courses/[courseId]/complete', _GET);
export const POST = withApiAudit('/api/courses/[courseId]/complete', _POST);
