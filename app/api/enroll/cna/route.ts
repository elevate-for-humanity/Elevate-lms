// PUBLIC ROUTE: CNA program enrollment form
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireDbWrite, success, failure } from '@/lib/api/safe-handler';
import { checkFailureInjection } from '@/lib/api/failure-injection';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { sendEmail } from '@/lib/email/sendgrid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    // Failure injection runs before rate limiting so tests aren't blocked
    // by an unconfigured Redis instance in dev/staging environments
    checkFailureInjection(request);

    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      dateOfBirth,
      emergencyContact,
      emergencyPhone,
      paymentOption,
      program,
      price,
      paymentPlan,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Resolve program_id for CNA from the programs table
    const { data: programRow } = await supabase
      .from('programs')
      .select('id')
      .eq('slug', program || 'cna')
      .maybeSingle();

    // DB write is required — no fallthrough on failure
    const enrollment = await requireDbWrite(
      supabase
        .from('program_enrollments')
        .insert({
          email,
          phone,
          full_name: `${firstName} ${lastName}`.trim(),
          program_id: programRow?.id ?? null,
          funding_source: paymentOption === 'plan' ? 'payment_plan' : 'self_pay',
          amount_paid_cents: paymentOption === 'plan'
            ? Math.round((paymentPlan?.downPayment ?? 0) * 100)
            : Math.round((price ?? 0) * 100),
          status: 'pending_payment',
          enrollment_type: 'cna',
          source: 'cna_enrollment_form',
          notes: JSON.stringify({
            firstName,
            lastName,
            address,
            city,
            state,
            zip_code: zip,
            date_of_birth: dateOfBirth,
            emergency_contact: emergencyContact,
            emergency_phone: emergencyPhone,
            payment_option: paymentOption,
            total_price: price,
            payment_plan: paymentPlan ?? null,
          }),
        })
        .select()
        .maybeSingle(),
      'Failed to create enrollment record. Please try again or call ' + PLATFORM_DEFAULTS.supportPhone + '.',
    );

    // Send confirmation email — fire-and-forget, never block the response
    sendEmail({
      to: email,
      subject: `Application Received — CNA Program | ${PLATFORM_DEFAULTS.orgName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
          <div style="background:#1E3A5F;padding:24px 32px">
            <h1 style="color:#fff;margin:0;font-size:22px">${PLATFORM_DEFAULTS.orgName}</h1>
          </div>
          <div style="padding:32px">
            <h2 style="margin-top:0">We received your CNA application, ${firstName}!</h2>
            <p>Your application has been submitted and is under review. Here's a summary:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px 0;color:#64748b;width:40%">Program</td><td style="padding:8px 0;font-weight:600">Certified Nursing Assistant (CNA)</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Name</td><td style="padding:8px 0">${firstName} ${lastName}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0">${email}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Phone</td><td style="padding:8px 0">${phone}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Payment Option</td><td style="padding:8px 0">${paymentOption === 'plan' ? 'Payment Plan' : 'Full Payment'}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Application ID</td><td style="padding:8px 0;font-family:monospace;font-size:12px">${enrollment.id}</td></tr>
            </table>
            <p><strong>Next step:</strong> Complete your payment to secure your seat. If you were redirected to checkout, your payment link is active.</p>
            <p>Questions? Contact us at <a href="mailto:${PLATFORM_DEFAULTS.supportEmail}" style="color:#1E3A5F">${PLATFORM_DEFAULTS.supportEmail}</a> or call ${PLATFORM_DEFAULTS.supportPhone}.</p>
          </div>
          <div style="background:#f8fafc;padding:16px 32px;font-size:12px;color:#94a3b8;text-align:center">
            ${PLATFORM_DEFAULTS.orgName} · Indianapolis, IN
          </div>
        </div>
      `,
    }).catch((err) => logger.warn('[enroll/cna] Confirmation email failed', { err }));

    return success({ enrollmentId: enrollment.id });
  } catch (err: unknown) {
    const message = 'Failed to process enrollment';
    logger.error('CNA enrollment error:', err);
    return failure(message);
  }
}
export const POST = withApiAudit('/api/enroll/cna', _POST);
