/**
 * Enrollment Status Update API
 * Handles enrollment status transitions with notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { onEnrollmentStatusChange } from '@/lib/notifications/enrollment-notifications';
import { setAuditContext } from '@/lib/audit-context';
import { logger } from '@/lib/logger';
import { VALID_ENROLLMENT_STATES } from '@/lib/enrollment/enrollment-flow';
import { z } from 'zod';

const StatusUpdateSchema = z.object({
  enrollmentId: z.string().uuid(),
  newStatus: z.enum(VALID_ENROLLMENT_STATES as unknown as [string, ...string[]]),
  reason: z.string().optional(),
  notifyStudent: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    // Auth check - admin/instructor only
    const { user, profile } = await requireRole(['admin', 'super_admin', 'instructor']);
    const supabase = await createClient();

    const body = await req.json();
    const validation = StatusUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { enrollmentId, newStatus, reason, notifyStudent } = validation.data;

    // Get current enrollment
    const { data: enrollment, error: fetchError } = await supabase
      .from('program_enrollments')
      .select(`
        id,
        user_id,
        status,
        course_id,
        program_id,
        programs ( title, slug )
      `)
      .eq('id', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    const previousStatus = enrollment.status;

    // Update status
    await setAuditContext(supabase, { 
      actorUserId: user.id,
      action: 'enrollment_status_change',
      resourceId: enrollmentId,
    });

    const { error: updateError } = await supabase
      .from('program_enrollments')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId);

    if (updateError) {
      logger.error('[status] Failed to update enrollment', updateError);
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    // Record status history
    await supabase
      .from('enrollment_status_history')
      .insert({
        enrollment_id: enrollmentId,
        user_id: user.id,
        previous_status: previousStatus,
        new_status: newStatus,
        reason: reason || null,
        changed_at: new Date().toISOString(),
      });

    // Send notification to student
    if (notifyStudent) {
      // Get student info
      const { data: student } = await supabase
        .from('profiles')
        .select('email, first_name')
        .eq('id', enrollment.user_id)
        .single();

      if (student?.email) {
        await onEnrollmentStatusChange({
          userId: enrollment.user_id,
          email: student.email,
          firstName: student.first_name || 'Student',
          programName: (enrollment.programs as { title?: string })?.title || 'Your Program',
          enrollmentId: enrollmentId,
          previousStatus: previousStatus as any,
          newStatus: newStatus as any,
        });
      }
    }

    logger.info('[status] Enrollment status updated', {
      enrollmentId,
      from: previousStatus,
      to: newStatus,
      updatedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      enrollmentId,
      previousStatus,
      newStatus,
      notified: notifyStudent,
    });

  } catch (error) {
    logger.error('[status] Error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get status history for an enrollment
export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin', 'super_admin', 'instructor']);
    const supabase = await createClient();

    const { searchParams } = new URL(req.url);
    const enrollmentId = searchParams.get('enrollmentId');

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'enrollmentId required' },
        { status: 400 }
      );
    }

    const { data: history } = await supabase
      .from('enrollment_status_history')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('changed_at', { ascending: true });

    return NextResponse.json({ history: history || [] });

  } catch (error) {
    logger.error('[status] Error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
