import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { sendStudentAcceptanceNotification } from '@/lib/email/service';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
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

    // Verify user is a program holder
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'program_holder') {
      return NextResponse.json(
        { error: 'Forbidden - Program holder access required' },
        { status: 403 }
      );
    }

    // Get program holder record
    const { data: programHolder, error: phError } = await supabase
      .from('program_holders')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (phError || !programHolder) {
      return NextResponse.json(
        { error: 'Program holder record not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await parseBody<Record<string, any>>(request);
    const { enrollment_id } = body;

    if (!enrollment_id) {
      return NextResponse.json(
        { error: 'Missing required field: enrollment_id' },
        { status: 400 }
      );
    }

    // Verify the enrollment belongs to this program holder
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('program_holder_students')
      .select('*')
      .eq('id', enrollment_id)
      .eq('program_holder_id', programHolder.id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found or access denied' },
        { status: 404 }
      );
    }

    // Update enrollment status to active
    const { data: updated, error: updateError } = await supabase
      .from('program_holder_students')
      .update({
        status: 'active',
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq('id', enrollment_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to accept student', details: updateError.message },
        { status: 500 }
      );
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
      .single();

    const { data: phProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Send notification email to student (non-blocking)
    if (studentProfile?.email) {
      sendStudentAcceptanceNotification(
        studentProfile.email,
        studentProfile.full_name || 'Student',
        phProfile?.full_name || 'Program Holder'
      ).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Student accepted successfully',
        enrollment: updated,
      },
      { status: 200 }
    );
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
