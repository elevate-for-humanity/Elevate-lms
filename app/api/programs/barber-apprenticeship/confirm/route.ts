export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { barberConfirmationAdminEmail } from '@/lib/email/templates/barber-full-onboarding';
import { logger } from '@/lib/logger';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

/**
 * POST /api/programs/barber-apprenticeship/confirm
 *
 * Called when an applicant clicks "Yes, I Want to Enroll" or "No" in the
 * onboarding email. Updates the application status and notifies admin.
 */
export async function POST(request: NextRequest) {
  try {
    const { token, response } = await request.json();

    if (!token || !['yes', 'no'].includes(response)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    // Look up application by confirm_token
    const { data: app, error } = await admin
      .from('applications')
      .select('id, first_name, last_name, email, phone, status')
      .eq('submit_token', token)
      .single();

    if (error || !app) {
      logger.warn('[BarberConfirm] Invalid token:', token);
      return NextResponse.json({ error: 'Invalid or expired confirmation link' }, { status: 404 });
    }

    // Update application status
    const newStatus = response === 'yes' ? 'confirmed' : 'declined';
    await admin
      .from('applications')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        review_notes: response === 'yes'
          ? 'Applicant confirmed via onboarding email — ready for orientation + payment'
          : 'Applicant declined via onboarding email',
      })
      .eq('id', app.id);

    // Send admin notification
    const adminEmail = barberConfirmationAdminEmail({
      firstName: app.first_name || '',
      lastName: app.last_name || '',
      email: app.email || '',
      phone: app.phone || '',
      response,
      applicationId: app.id,
    });

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: adminEmail.subject,
      html: adminEmail.html,
    }).catch((err) => logger.error('[BarberConfirm] Admin email failed:', err));

    logger.info(`[BarberConfirm] ${app.first_name} ${app.last_name} responded: ${response}`);

    return NextResponse.json({
      success: true,
      response,
      message: response === 'yes'
        ? 'Thank you for confirming! We will contact you within 24 hours to schedule your orientation.'
        : 'We understand. If you change your mind, contact us at (317) 314-3757.',
    });
  } catch (err) {
    logger.error('[BarberConfirm] Error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
