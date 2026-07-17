/**
 * POST /api/booth-rental/sign-mou
 *
 * Records a signed Booth Rental Agreement after Stripe checkout completes.
 * Verifies the Stripe session, saves the signature, and activates the rental record.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@elevateforhumanity.org';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { sessionId, signatureName, signatureDataUrl, discipline, agreedToTerms } = body;

    if (!sessionId || !signatureName || !agreedToTerms) {
      return safeError('Missing required fields', 400);
    }

    const stripe = getStripe();
    if (!stripe) return safeError('Payment system unavailable', 503);

    // Verify the Stripe session is paid
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status === 'unpaid') {
      return safeError('Payment not completed. Please complete checkout before signing.', 402);
    }

    const renterEmail = session.customer_details?.email ?? session.metadata?.renter_email ?? '';
    const renterName = session.metadata?.renter_name ?? signatureName;
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null;

    const db = await requireAdminClient();
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;
    const disciplineValue = discipline ?? session.metadata?.discipline ?? 'barber';
    const now = new Date().toISOString();

    // 1. Upsert subscription record (activates the rental)
    const { error: subError } = await db
      .from('booth_rental_subscriptions')
      .upsert(
        {
          stripe_session_id: sessionId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: stripeCustomerId,
          renter_name: renterName,
          renter_email: renterEmail,
          discipline: disciplineValue,
          mou_signed: true,
          mou_signed_at: now,
          payment_status: 'active',
          updated_at: now,
        },
        { onConflict: 'stripe_session_id' },
      );

    if (subError) {
      logger.error('[booth-rental/sign-mou] subscription upsert failed', subError);
      return safeError('Failed to activate rental', 500);
    }

    // 2. Insert agreement record (audit trail)
    const { data: rental, error: agreementError } = await db
      .from('booth_rental_agreements')
      .insert({
        stripe_session_id: sessionId,
        stripe_customer_id: stripeCustomerId,
        discipline: disciplineValue,
        renter_name: renterName,
        renter_email: renterEmail,
        printed_name: signatureName,
        signature_data_url: signatureDataUrl ?? '',
        signed_at: now,
      })
      .select('id')
      .single();

    if (agreementError) {
      logger.error('[booth-rental/sign-mou] agreement insert failed', agreementError);
      // Non-fatal — subscription is already active
    }

    // Send confirmation email to renter
    await sendEmail({
      to: renterEmail,
      subject: 'Booth Rental Agreement Signed — ' + PLATFORM_DEFAULTS.orgName + '',
      html: `
        <h2>Welcome, ${signatureName.split(' ')[0]}!</h2>
        <p>Your Booth Rental Agreement has been signed and your rental is now active.</p>
        <h3>What happens next:</h3>
        <ul>
          <li>Our team will contact you within 1 business day to schedule your move-in.</li>
          <li>Your weekly rent will be charged automatically every Friday.</li>
          <li>A copy of your signed agreement is on file with ${PLATFORM_DEFAULTS.orgName}.</li>
        </ul>
        <p>Questions? Call <a href="tel:${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a> or email <a href="mailto:info@${PLATFORM_DEFAULTS.canonicalDomain}">info@${PLATFORM_DEFAULTS.canonicalDomain}</a>.</p>
        <p>— ${PLATFORM_DEFAULTS.orgName}</p>
      `,
    }).catch(() => { /* non-fatal */ });

    // Notify admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[BOOTH RENTAL] New signed agreement — ${renterName}`,
      html: `
        <h3>New Booth Rental Agreement Signed</h3>
        <table>
          <tr><td><strong>Name</strong></td><td>${renterName}</td></tr>
          <tr><td><strong>Email</strong></td><td>${renterEmail}</td></tr>
          <tr><td><strong>Discipline</strong></td><td>${discipline ?? 'N/A'}</td></tr>
          <tr><td><strong>Stripe Session</strong></td><td>${sessionId}</td></tr>
          <tr><td><strong>Subscription</strong></td><td>${subscriptionId ?? 'N/A'}</td></tr>
          <tr><td><strong>Signed At</strong></td><td>${new Date().toLocaleString()}</td></tr>
        </table>
        <p><a href="${SITE_URL}/admin/booth-rentals">View in Admin Dashboard</a></p>
      `,
    }).catch(() => { /* non-fatal */ });

    logger.info('[booth-rental/sign-mou] Agreement signed', {
      rentalId: rental?.id,
      sessionId,
      renterEmail,
    });

    return NextResponse.json({ success: true, rentalId: rental?.id });
  } catch (err) {
    return safeInternalError(err, 'Failed to save booth rental agreement');
  }
}
