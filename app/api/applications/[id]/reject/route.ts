import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { sendEmail } from '@/lib/email/resend';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Check if user is admin
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get application
    const { data: application, error: appError } = await db
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Update application status
    const { error: updateError } = await db
      .from('applications')
      .update({
        status: 'rejected',
        notes: reason ? `${application.notes || ''}\nRejection reason: ${reason}` : application.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to reject application' }, { status: 500 });
    }

    // Send rejection email
    await sendEmail({
      to: application.email,
      subject: 'Application Update - Elevate for Humanity',
      html: `
        <h2>Hello ${application.first_name},</h2>
        <p>Thank you for your interest in Elevate for Humanity.</p>
        <p>After reviewing your application, we are unable to offer you admission at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>This decision does not reflect on your potential. We encourage you to:</p>
        <ul>
          <li>Reapply in the future when circumstances change</li>
          <li>Explore other training opportunities in your area</li>
          <li>Contact us if you have questions about this decision</li>
        </ul>
        <p>Questions? Call us at <a href="tel:317-314-3757">317-314-3757</a></p>
        <p>Best regards,<br>Elevate for Humanity Admissions Team</p>
      `,
    });

    return NextResponse.json({
      success: true,
      applicationId: id,
      status: 'rejected',
    });
  } catch (error) {
    logger.error('Application rejection error:', error);
    return NextResponse.json({ error: 'Failed to reject application' }, { status: 500 });
  }
}
