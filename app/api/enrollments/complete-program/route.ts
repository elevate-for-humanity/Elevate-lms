
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * PROGRAM COMPLETION ENDPOINT
 * 
 * Triggered when a student completes all requirements for a program.
 * Delegates to the authoritative certificate issuance service.
 * 
 * This endpoint is for PROGRAM completion (finished training),
 * NOT enrollment completion (finished payment).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { issueCertificate } from '@/lib/certificates/issue-certificate';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

interface CompleteProgramRequest {
  enrollment_id: string;
}

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CompleteProgramRequest = await req.json();
    const { enrollment_id } = body;

    if (!enrollment_id) {
      return NextResponse.json(
        { error: 'Missing required field: enrollment_id' },
        { status: 400 }
      );
    }

    logger.info('Starting program completion', { enrollment_id, user_id: user.id });

    // Get enrollment with program and student details
    const { data: enrollment, error: enrollmentError } = await db
      .from('program_enrollments')
      .select(`
        id,
        user_id,
        program_id,
        status,
        completed_at,
        certificate_id,
        programs:program_id (
          id,
          name,
          slug,
          duration_hours
        )
      `)
      .eq('id', enrollment_id)
      .single();

    if (enrollmentError || !enrollment) {
      logger.error('Enrollment not found', { enrollment_id, error: enrollmentError });
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Verify user owns this enrollment or is admin
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
    if (enrollment.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get student profile
    const { data: studentProfile } = await db
      .from('profiles')
      .select('full_name, first_name, last_name, email')
      .eq('id', enrollment.user_id)
      .single();

    if (!studentProfile || !studentProfile.email) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const studentName = studentProfile.full_name || 
      `${studentProfile.first_name || ''} ${studentProfile.last_name || ''}`.trim() ||
      'Student';
    const programs = enrollment.programs as any;
    const programName = programs?.name || 'Program';
    const programHours = programs?.duration_hours || null;

    // Use authoritative certificate issuance service
    const result = await issueCertificate({
      supabase,
      enrollmentId: enrollment_id,
      studentId: enrollment.user_id,
      programId: enrollment.program_id,
      studentName,
      studentEmail: studentProfile.email,
      programName,
      programHours,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      already_completed: result.alreadyIssued,
      certificate: result.certificate,
      enrollment: {
        id: enrollment_id,
        status: 'completed',
        completed_at: result.certificate?.completion_date,
      },
    });
  } catch (error) {
    logger.error('Program completion error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/enrollments/complete-program', _POST);
