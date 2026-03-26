
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

/**
 * Instructor Attestation API
 *
 * POST — Create an attestation (instructor signs off on student progress)
 * GET  — List attestations (filtered by student, program, type)
 *
 * Attestation types:
 *   module_completion      — LMS module sign-off
 *   session_delivery       — cohort session delivery confirmation
 *   weekly_review          — periodic distance RTI progress review
 *   competency_checkpoint  — practical skills evaluation
 *
 * Only instructors, lead instructors, program directors, and sponsor admins
 * can create attestations. Attestations are append-only (immutable).
 */

const ALLOWED_ROLES = new Set([
  'instructor', 'lead_instructor', 'program_director',
  'sponsor_admin', 'admin', 'super_admin',
]);

const ATTESTATION_TYPES = new Set([
  'module_completion', 'session_delivery', 'weekly_review', 'competency_checkpoint',
]);

const ATTESTATION_METHODS = new Set([
  'digital_signature', 'in_person', 'video_review', 'lms_system',
]);

async function getInstructorProfile(db: any, userId: string) {
  // Check profiles table for role
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', userId)
    .single();

  if (!profile) return null;

  // Map admin roles to attestation roles
  let instructorRole = profile.role;
  if (profile.role === 'admin' || profile.role === 'super_admin') {
    instructorRole = 'sponsor_admin';
  }

  // Also check if they're an instructor in partner_users
  const { data: partnerUser } = await supabase
    .from('partner_users')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['instructor', 'lead_instructor', 'program_director'])
    .maybeSingle();

  if (partnerUser) {
    instructorRole = partnerUser.role;
  }

  return {
    id: profile.id,
    name: profile.full_name || profile.email,
    role: instructorRole,
    allowed: ALLOWED_ROLES.has(profile.role) || !!partnerUser,
  };
}

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const instructor = await getInstructorProfile(db, user.id);
  if (!instructor?.allowed) {
    return NextResponse.json({ error: 'Only instructors can create attestations' }, { status: 403 });
  }

  const body = await req.json();
  const {
    attestation_type,
    student_id,
    program_id,
    course_id,
    cohort_session_id,
    lesson_id,
    hour_entry_id,
    competencies_covered,
    engagement_notes,
    hours_attested,
    attestation_method = 'digital_signature',
  } = body;

  // Validate required fields
  if (!attestation_type || !student_id) {
    return NextResponse.json(
      { error: 'attestation_type and student_id are required' },
      { status: 400 }
    );
  }

  if (!ATTESTATION_TYPES.has(attestation_type)) {
    return NextResponse.json(
      { error: `Invalid attestation_type. Must be one of: ${[...ATTESTATION_TYPES].join(', ')}` },
      { status: 400 }
    );
  }

  if (!ATTESTATION_METHODS.has(attestation_method)) {
    return NextResponse.json(
      { error: `Invalid attestation_method. Must be one of: ${[...ATTESTATION_METHODS].join(', ')}` },
      { status: 400 }
    );
  }

  // At least one context reference must be provided
  if (!program_id && !course_id && !cohort_session_id && !lesson_id && !hour_entry_id) {
    return NextResponse.json(
      { error: 'At least one context reference (program_id, course_id, cohort_session_id, lesson_id, or hour_entry_id) is required' },
      { status: 400 }
    );
  }

  // Verify student exists
  const { data: student } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', student_id)
    .single();

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  // For session_delivery: verify the cohort session exists and isn't already attested by this instructor
  if (attestation_type === 'session_delivery' && cohort_session_id) {
    const { data: existingAttestation } = await supabase
      .from('instructor_attestations')
      .select('id')
      .eq('instructor_id', user.id)
      .eq('student_id', student_id)
      .eq('cohort_session_id', cohort_session_id)
      .eq('attestation_type', 'session_delivery')
      .maybeSingle();

    if (existingAttestation) {
      return NextResponse.json(
        { error: 'Session already attested for this student', attestation_id: existingAttestation.id },
        { status: 409 }
      );
    }
  }

  // For module_completion: verify the lesson exists and check for duplicate
  if (attestation_type === 'module_completion' && lesson_id) {
    const { data: existingAttestation } = await supabase
      .from('instructor_attestations')
      .select('id')
      .eq('instructor_id', user.id)
      .eq('student_id', student_id)
      .eq('lesson_id', lesson_id)
      .eq('attestation_type', 'module_completion')
      .maybeSingle();

    if (existingAttestation) {
      return NextResponse.json(
        { error: 'Module already attested for this student', attestation_id: existingAttestation.id },
        { status: 409 }
      );
    }
  }

  // Insert attestation
  const { data: attestation, error: insertErr } = await supabase
    .from('instructor_attestations')
    .insert({
      instructor_id: user.id,
      instructor_name: instructor.name,
      instructor_role: instructor.role,
      attestation_type,
      student_id,
      program_id: program_id || null,
      course_id: course_id || null,
      cohort_session_id: cohort_session_id || null,
      lesson_id: lesson_id || null,
      hour_entry_id: hour_entry_id || null,
      competencies_covered: competencies_covered || null,
      engagement_verified: true,
      engagement_notes: engagement_notes || null,
      hours_attested: hours_attested || null,
      attestation_method,
    })
    .select('*')
    .single();

  if (insertErr) {
    logger.error('[attestation] Insert error:', insertErr);
    return NextResponse.json({ error: 'Failed to create attestation' }, { status: 500 });
  }

  // If attesting an hour_entry, update its engagement_verified status
  if (hour_entry_id) {
    await supabase
      .from('lesson_progress')
      .update({
        engagement_verified: true,
        engagement_verified_by: user.id,
        engagement_verified_at: new Date().toISOString(),
      })
      .eq('id', hour_entry_id);
  }

  logger.info('[attestation] Created', {
    id: attestation.id,
    type: attestation_type,
    instructor: instructor.name,
    student_id,
  });

  return NextResponse.json({ ok: true, attestation });
}

async function _GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const studentId = url.searchParams.get('student_id');
  const programId = url.searchParams.get('program_id');
  const courseId = url.searchParams.get('course_id');
  const type = url.searchParams.get('type');
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
  const offset = Number(url.searchParams.get('offset')) || 0;

  let query = supabase
    .from('instructor_attestations')
    .select('*')
    .order('attested_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Instructors see attestations they created; admins see all; students see their own
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  if (!isAdmin) {
    // Non-admins: see own attestations (as instructor or student)
    if (studentId && studentId === user.id) {
      query = query.eq('student_id', user.id);
    } else {
      query = query.or(`instructor_id.eq.${user.id},student_id.eq.${user.id}`);
    }
  }

  if (studentId) query = query.eq('student_id', studentId);
  if (programId) query = query.eq('program_id', programId);
  if (courseId) query = query.eq('course_id', courseId);
  if (type && ATTESTATION_TYPES.has(type)) query = query.eq('attestation_type', type);

  const { data: attestations, error } = await query;

  if (error) {
    logger.error('[attestation] Query error:', error);
    return NextResponse.json({ error: 'Failed to fetch attestations' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, attestations, count: attestations?.length || 0 });
}

export const POST = withApiAudit('/api/instructor/attestations', _POST);
export const GET = withApiAudit('/api/instructor/attestations', _GET);
