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
import { checkCertificateIssuanceEligibility } from '@/lib/services/credential-pipeline';
import { createHash } from 'crypto';

const BUILD_SHA = process.env.COMMIT_REF?.slice(0, 12) || 'dev';

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
        .select('id, title, slug, issuance_policy, min_rti_hours, min_ojl_hours, credential_type, credential_name, requires_instructor_attestation, min_engagement_hours')
        .eq('slug', programSlug)
        .single();

      if (!prog) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 });
      }
      program = prog;

      // Check for an enrollment or application for this user + program
      const { data: enroll } = await db
        .from('program_enrollments')
        .select('id, user_id, course_id, completed_at, status, funding_source, funding_status, amount_paid_cents, stripe_payment_intent_id')
        .eq('user_id', user.id)
        .eq('program_id', prog.id)
        .maybeSingle();

      if (enroll?.status === 'pending_funding_verification') {
        return NextResponse.json(
          { error: 'Certificates cannot be issued while enrollment is pending funding verification.' },
          { status: 403 }
        );
      }
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
          funding_source,
          funding_status,
          amount_paid_cents,
          stripe_payment_intent_id,
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
              min_ojl_hours,
              requires_instructor_attestation,
              min_engagement_hours
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

      // Engagement-hours gate: if program specifies min_engagement_hours,
      // verify accumulated seat time meets the threshold.
      // This proves "instructional engagement, not just logins."
      if (program?.min_engagement_hours && program.min_engagement_hours > 0 && course_id) {
        const { data: progressRows } = await db
          .from('lesson_progress')
          .select('time_spent_seconds')
          .eq('user_id', enrollment.user_id)
          .eq('course_id', course_id);

        const totalSeconds = (progressRows || []).reduce(
          (sum: number, row: any) => sum + (row.time_spent_seconds || 0), 0
        );
        const totalEngagementHours = Math.round((totalSeconds / 3600) * 10) / 10;

        if (totalEngagementHours < program.min_engagement_hours) {
          return NextResponse.json(
            {
              error: 'Insufficient instructional engagement hours',
              message: `This program requires ${program.min_engagement_hours} hours of instructional engagement. Current: ${totalEngagementHours} hours.`,
              engagement_hours: totalEngagementHours,
              required_hours: program.min_engagement_hours,
            },
            { status: 400 }
          );
        }
      }
    }

    // 2b) Instructor attestation gate (distance RTI requirement)
    // Programs with requires_instructor_attestation=true must have
    // documented instructional oversight before credential issuance.
    if (program?.requires_instructor_attestation) {
      const { data: attestations, error: attestErr } = await db
        .from('instructor_attestations')
        .select('id, attestation_type, hours_attested, attested_at')
        .eq('student_id', enrollment.user_id)
        .eq('program_id', program.id);

      if (attestErr) {
        logger.error('Error checking instructor attestations:', attestErr);
      }

      const attestationCount = attestations?.length || 0;

      if (attestationCount === 0) {
        return NextResponse.json(
          {
            error: 'Instructor attestation required',
            message: 'This program requires instructor sign-off before certificate issuance. No attestations found for this student.',
          },
          { status: 400 }
        );
      }

      // If program has min_engagement_hours, verify attested hours meet threshold
      if (program.min_engagement_hours && program.min_engagement_hours > 0) {
        const totalAttestedHours = (attestations || []).reduce(
          (sum: number, a: any) => sum + (a.hours_attested || 0), 0
        );

        if (totalAttestedHours < program.min_engagement_hours) {
          return NextResponse.json(
            {
              error: 'Insufficient attested engagement hours',
              message: `This program requires ${program.min_engagement_hours} instructor-attested engagement hours. Current: ${totalAttestedHours}.`,
              attested_hours: totalAttestedHours,
              required_hours: program.min_engagement_hours,
            },
            { status: 400 }
          );
        }
      }

      // Store attestation evidence for the issuance snapshot
      eligibilityEvidence = {
        ...eligibilityEvidence,
        attestation_count: attestationCount,
        attested_hours: (attestations || []).reduce(
          (sum: number, a: any) => sum + (a.hours_attested || 0), 0
        ),
        attestation_types: [...new Set((attestations || []).map((a: any) => a.attestation_type))],
      };
    }

    // 2c) Credential pipeline gate — payment + exam passage
    // Checks program_credentials for a primary credential. If one exists:
    //   - self_pay credentials require a paid exam_funding_authorization
    //   - non-exam programs skip the exam passage check
    //   - all other primary credentials require a passed credential_attempt
    if (program?.id) {
      const gate = await checkCertificateIssuanceEligibility(enrollment.user_id, program.id);
      if (!gate.eligible) {
        return NextResponse.json({ error: gate.reason }, { status: 400 });
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
        // Immutable point-in-time snapshot at issuance. Never updated after insert.
        // DB trigger (trg_protect_issuance_snapshot) blocks mutation.
        // Auditors compare this against current funding_status to see what changed.
        issuance_snapshot: (() => {
          const snapshot = {
            snapshot_version: 1,
            build_sha: BUILD_SHA,
            issued_at: new Date().toISOString(),
            funding_source: enrollment?.funding_source || null,
            funding_status_at_issuance: enrollment?.funding_status || 'funded',
            amount_paid_cents: enrollment?.amount_paid_cents || null,
            payment_reference: enrollment?.stripe_payment_intent_id || null,
            enrollment_id: enrollment?.id || null,
            enrollment_status_at_issuance: enrollment?.status || null,
            issuance_policy: isApprenticeship ? 'apprenticeship_certificate' : 'course_certificate',
            competency_evidence: isApprenticeship ? {
              ojl_hours: eligibilityEvidence?.approvedHours?.ojl || 0,
              rti_hours: eligibilityEvidence?.approvedHours?.rti || 0,
              min_ojl_required: eligibilityEvidence?.minOjlHours || 0,
              min_rti_required: eligibilityEvidence?.minRtiHours || 0,
            } : {
              seat_time_hours: course?.duration_hours || 0,
            },
            instructor_attestation: program?.requires_instructor_attestation ? {
              attestation_count: eligibilityEvidence?.attestation_count || 0,
              attested_hours: eligibilityEvidence?.attested_hours || 0,
              attestation_types: eligibilityEvidence?.attestation_types || [],
              min_engagement_hours: program?.min_engagement_hours || null,
            } : null,
            issued_by: user.id,
          };
          const canonical = JSON.stringify(snapshot, Object.keys(snapshot).sort());
          return {
            ...snapshot,
            snapshot_hash: createHash('sha256').update(canonical).digest('hex'),
          };
        })(),
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
