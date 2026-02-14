export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin: Assign Certiport Voucher
 *
 * After purchasing a voucher from the Certiport portal,
 * admin enters the voucher code here to assign it to the student.
 *
 * This updates the exam request status to 'voucher_assigned'
 * and stores the voucher code so the student can see it.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { requestId, voucherCode, expiresAt, notes } = body;

    if (!requestId || !voucherCode) {
      return NextResponse.json(
        { error: 'requestId and voucherCode are required' },
        { status: 400 }
      );
    }

    // Update the exam request
    const { data: updated, error } = await supabase
      .from('certiport_exam_requests')
      .update({
        voucher_code: voucherCode,
        voucher_expires_at: expiresAt || null,
        status: 'voucher_assigned',
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', requestId)
      .in('status', ['pending', 'paid'])
      .select('id, user_id, exam_name, student_email')
      .single();

    if (error || !updated) {
      console.error('Failed to assign voucher:', error);
      return NextResponse.json(
        { error: 'Failed to assign voucher. Request may not exist or is already assigned.' },
        { status: 400 }
      );
    }

    // Optionally trigger email notification to student
    // (uses existing Supabase edge function if configured)
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: updated.user_id,
          type: 'certiport_voucher_assigned',
          title: 'Your Exam Voucher is Ready',
          message: `Your voucher for ${updated.exam_name} has been assigned. Log in to view your voucher code and schedule your exam.`,
          email: updated.student_email,
        },
      });
    } catch {
      // Notification is best-effort
    }

    return NextResponse.json({
      message: 'Voucher assigned successfully.',
      requestId: updated.id,
    });
  } catch (error) {
    console.error('Assign voucher error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
