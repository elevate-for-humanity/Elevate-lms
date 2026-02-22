import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(
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
      .from('enrollments')
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
      .from('lessons')
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

    // Mark course as completed
    const { error: updateError } = await db
      .from('enrollments')
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

    // Issue certificate via canonical service
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
      courseTitle: course.course_name,
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

export async function GET(
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
      .from('enrollments')
      .select('status, progress, completed_at')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    const { data: lessons } = await db
      .from('lessons')
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
