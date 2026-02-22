export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch((err) => {
      logger.error('Failed to parse request body:', err);
      return {};
    });
    const {
      enrollmentId,
      courseId,
    }: {
      enrollmentId?: number | string;
      courseId?: number | string;
    } = body || {};

    if (!enrollmentId && !courseId) {
      return NextResponse.json(
        { error: 'Missing enrollmentId or courseId' },
        { status: 400 }
      );
    }

    // 1) Load enrollment + course + program
    const { data: enrollment, error: enrollmentError } = await db
      .from('enrollments')
      .select(
        `
        id,
        user_id,
        course_id,
        completed_at,
        status,
        courses (
          id,
          title,
          duration_hours,
          program_id,
          programs (
            id,
            title
          )
        )
      `
      )
      .eq(enrollmentId ? 'id' : 'course_id', enrollmentId ?? courseId)
      .eq('user_id', user.id)
      .single();

    if (enrollmentError || !enrollment) {
      logger.error('Enrollment error:', enrollmentError);
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    const course = Array.isArray(enrollment.courses)
      ? enrollment.courses[0]
      : enrollment.courses;
    const program = course?.programs
      ? Array.isArray(course.programs)
        ? course.programs[0]
        : course.programs
      : null;

    const course_id = course?.id;

    if (!course_id) {
      return NextResponse.json(
        { error: 'Course missing on enrollment' },
        { status: 400 }
      );
    }

    // 2) Check course completion via view
    const { data: completionRow, error: completionError } = await db
      .from('course_completion_status')
      .select(
        `
        student_id,
        course_id,
        is_course_completed,
        total_required_lessons,
        completed_required_lessons
      `
      )
      .eq('student_id', enrollment.user_id)
      .eq('course_id', course_id)
      .maybeSingle();

    if (completionError) {
      logger.error('Error reading course_completion_status:', completionError);
    }

    const isCompletedByLessons = completionRow?.is_course_completed ?? false;

    if (!isCompletedByLessons) {
      return NextResponse.json(
        {
          error: 'Course not fully completed',
          message: `You have completed ${completionRow?.completed_required_lessons || 0} of ${completionRow?.total_required_lessons || 0} required lessons.`,
          details: completionRow ?? null,
        },
        { status: 400 }
      );
    }

    // 3) Check if certificate already exists
    const { data: existingCert } = await db
      .from('certificates')
      .select('id, certificate_number, verification_code')
      .eq('student_id', enrollment.user_id)
      .eq('course_id', course_id)
      .maybeSingle();

    if (existingCert) {
      return NextResponse.json({
        ok: true,
        certificate: existingCert,
        message: 'Certificate already exists',
      });
    }

    // 4) Load student profile
    const { data: profile } = await db
      .from('user_profiles')
      .select('full_name, email')
      .eq('user_id', enrollment.user_id)
      .maybeSingle();

    // 5) Generate certificate metadata
    const certificateNumber = `EFH-${course_id}-${Date.now()}`;
    const verificationCode = generateVerificationCode();
    const totalHours = course?.duration_hours || 0;

    // 6) Insert certificate
    const { data: cert, error: certError } = await db
      .from('certificates')
      .insert({
        student_id: enrollment.user_id,
        course_id,
        program_id: program?.id ?? null,
        certificate_number: certificateNumber,
        verification_code: verificationCode,
        issued_date: new Date().toISOString(),
        student_name: profile?.full_name || profile?.email || 'Student',
        course_title: course?.title,
        program_name: program?.title ?? null,
        hours_completed: totalHours,
        issued_by: user.id,
      })
      .select('*')
      .single();

    if (certError || !cert) {
      logger.error('Error inserting certificate:', certError);
      return NextResponse.json(
        { error: 'Failed to create certificate' },
        { status: 500 }
      );
    }

    // 7) Update enrollment status to completed and record certificate issuance timestamp
    const now = new Date().toISOString();
    await db
      .from('enrollments')
      .update({
        status: 'completed',
        completed_at: now,
        certificate_issued_at: now,
      })
      .eq('id', enrollment.id);

    return NextResponse.json({
      ok: true,
      certificate: cert,
      message: 'Certificate generated successfully',
    });
  } catch (error) { 
    logger.error('Error in /api/certificates/generate:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Generate a 10-character verification code
function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
