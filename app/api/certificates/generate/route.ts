export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { checkApprenticeshipEligibility } from '@/lib/hours/get-approved-hours';

async function _POST(request: Request) {
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
      programSlug,
    }: {
      enrollmentId?: number | string;
      courseId?: number | string;
      programSlug?: string;
    } = body || {};

    if (!enrollmentId && !courseId && !programSlug) {
      return NextResponse.json(
        { error: 'Missing enrollmentId, courseId, or programSlug' },
        { status: 400 }
      );
    }

    // 1) Load program and enrollment context
    let enrollment: any = null;
    let course: any = null;
    let program: any = null;
    let course_id: string | null = null;

    if (programSlug) {
      // Workforce path: load program directly by slug (no course required)
      const { data: prog } = await db
        .from('programs')
        .select('id, title, slug, issuance_policy, min_rti_hours, min_ojl_hours, credential_type, credential_name')
        .eq('slug', programSlug)
        .single();

      if (!prog) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 });
      }
      program = prog;

      // Check for an enrollment or application for this user + program
      const { data: enroll } = await db
        .from('program_enrollments')
        .select('id, user_id, course_id, completed_at, status')
        .eq('user_id', user.id)
        .eq('program_id', prog.id)
        .maybeSingle();

      enrollment = enroll || { id: null, user_id: user.id, course_id: null, status: 'active' };
      course_id = enroll?.course_id || null;
    } else {
      // Course path: load via enrollment → course → program
      const { data: enroll, error: enrollmentError } = await db
        .from('program_enrollments')
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
              title,
              slug,
              issuance_policy,
              min_rti_hours,
              min_ojl_hours
            )
          )
        `
        )
        .eq(enrollmentId ? 'id' : 'course_id', enrollmentId ?? courseId)
        .eq('user_id', user.id)
        .single();

      if (enrollmentError || !enroll) {
        logger.error('Enrollment error:', enrollmentError);
        return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
      }

      enrollment = enroll;
      course = Array.isArray(enroll.courses) ? enroll.courses[0] : enroll.courses;
      program = course?.programs
        ? Array.isArray(course.programs) ? course.programs[0] : course.programs
        : null;
      course_id = course?.id;

      if (!course_id) {
        return NextResponse.json({ error: 'Course missing on enrollment' }, { status: 400 });
      }
    }

    // 2) Eligibility gate — split by issuance policy
    const isApprenticeship = program?.issuance_policy === 'apprenticeship_certificate';
    let eligibilityEvidence: any = null;

    if (isApprenticeship) {
      // Apprenticeship programs: gate on separate OJL + RTI hour minimums.
      // OJL and RTI are independent — neither can substitute for the other.
      const eligibility = await checkApprenticeshipEligibility(db, enrollment.user_id, {
        min_rti_hours: program.min_rti_hours,
        min_ojl_hours: program.min_ojl_hours,
        slug: program.slug,
      });

      eligibilityEvidence = eligibility.evidence;

      if (!eligibility.eligible) {
        return NextResponse.json(
          {
            error: 'Hour requirements not met',
            message: 'Apprenticeship completion requires meeting both OJL and RTI hour minimums independently.',
            blocking_reasons: eligibility.blockingReasons,
            evidence: eligibility.evidence,
          },
          { status: 400 }
        );
      }
    } else {
      // Course-based programs (HVAC, OSHA, etc.): gate on lesson completion.
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
        hours_completed: isApprenticeship
          ? null  // No single "total" for apprenticeship — OJL and RTI are separate
          : (course?.duration_hours || 0),
        issued_by: user.id,
        credential_stack: isApprenticeship ? {
          issuance_policy: 'apprenticeship_certificate',
          issued_at: new Date().toISOString(),
          evidence: eligibilityEvidence,
        } : {
          issuance_policy: 'course_certificate',
        },
        metadata: isApprenticeship ? {
          approved_ojl_hours: eligibilityEvidence?.approvedHours?.ojl || 0,
          approved_rti_hours: eligibilityEvidence?.approvedHours?.rti || 0,
          min_ojl_hours: eligibilityEvidence?.minOjlHours || 0,
          min_rti_hours: eligibilityEvidence?.minRtiHours || 0,
        } : null,
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
      .from('program_enrollments')
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
export const POST = withApiAudit('/api/certificates/generate', _POST);
