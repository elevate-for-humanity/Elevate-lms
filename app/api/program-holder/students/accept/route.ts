import { NextRequest, NextResponse } from 'next/server';

import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { sendStudentAcceptanceNotification } from '@/lib/email/service';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a program holder and resolve holder ID from canonical profile link
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, program_holder_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'program_holder') {
      return NextResponse.json(
        { error: 'Forbidden - Program holder access required' },
        { status: 403 },
      );
    }

    // Get program holder record (prefer profiles.program_holder_id; fallback to legacy user_id link)
    let programHolderId: string | null = profile.program_holder_id ?? null;
    if (!programHolderId) {
      const { data: fallbackHolder, error: phError } = await supabase
        .from('program_holders')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (phError || !fallbackHolder) {
        return NextResponse.json({ error: 'Program holder record not found' }, { status: 404 });
      }
      programHolderId = fallbackHolder.id;
    }

    // Parse request body
    const body = await parseBody<Record<string, any>>(request);
    const { enrollment_id } = body;

    if (!enrollment_id) {
      return NextResponse.json({ error: 'Missing required field: enrollment_id' }, { status: 400 });
    }

    // Verify the enrollment belongs to this program holder
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('program_holder_students')
      .select('*')
      .eq('id', enrollment_id)
      .eq('program_holder_id', programHolderId)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found or access denied' }, { status: 404 });
    }

    // Update enrollment status only; avoid writes to optional columns that may not exist in all environments.
    const { data: updated, error: updateError } = await supabase
      .from('program_holder_students')
      .update({ status: 'active' })
      .eq('id', enrollment_id)
      .select()
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to accept student' }, { status: 500 });
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'student_accepted',
      resource_type: 'program_holder_student',
      resource_id: enrollment_id,
      metadata: {
        student_id: enrollment.student_id,
        program_id: enrollment.program_id,
      },
    });

    // Get student and program holder details for email
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', enrollment.student_id)
      .maybeSingle();

    const { data: phProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    // Send notification email to student (non-blocking)
    if (studentProfile?.email) {
      sendStudentAcceptanceNotification(
        studentProfile.email,
        studentProfile.full_name || 'Student',
        phProfile?.full_name || 'Program Holder',
      ).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Student accepted successfully',
        enrollment: updated,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/program-holder/students/accept', _POST);
