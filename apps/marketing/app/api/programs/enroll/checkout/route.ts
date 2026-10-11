import { applyRateLimit } from '@/lib/api/withRateLimit';
/**
 * CANONICAL PROGRAM ENROLLMENT CHECKOUT
 *
 * This is the single, canonical endpoint for ALL program enrollments.
 * Every program (Barber, HVAC, CPR, etc.) must use this endpoint.
 *
 * Fulfillment contract:
 *   kind: 'program_enrollment'
 *   program_id: UUID from programs.id
 *   student_id: auth user id
 *   program_slug: slug for routing
 *   funding_source: 'self_pay' | 'workone' | 'wioa' | 'grant' | 'employer'
 *
 * The QuickBooks webhook activates the pending enrollment after invoice payment.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
import { affirm } from '@/lib/affirm/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { isAffirmInvoiceAmount } from '@/lib/billing/invoice-checkout';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ENCHANTED_HEARTS } from '@/lib/partners/enchanted-hearts';
import { resolveQuickBooksProgramPromotion } from '@/lib/payments/quickbooks-program-promotion';

type FundingSource = 'self_pay' | 'workone' | 'wioa' | 'grant' | 'employer';

interface CheckoutRequest {
  program_id: string;
  funding_source?: FundingSource;
  payment_plan?: 'full' | 'installments';
  coupon_code?: string;
  partner_key?: string;
  payment_method?: 'quickbooks' | 'affirm';
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;
  try {
    const supabase = await createClient();

    // Require authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CheckoutRequest = await request.json();
    const paymentMethod = body.payment_method ?? 'quickbooks';
    if (!['quickbooks', 'affirm'].includes(paymentMethod))
      return NextResponse.json({ error: 'Choose a supported payment method.' }, { status: 400 });
    const {
      program_id,
      funding_source = 'self_pay',
      payment_plan = 'full',
      coupon_code = '',
      partner_key,
    } = body;

    if (!program_id) {
      return NextResponse.json({ error: 'program_id is required' }, { status: 400 });
    }

    // Validate funding_source
    const validFundingSources: FundingSource[] = [
      'self_pay',
      'workone',
      'wioa',
      'grant',
      'employer',
    ];
    if (!validFundingSources.includes(funding_source)) {
      return NextResponse.json({ error: 'Invalid funding_source' }, { status: 400 });
    }

    // Read the same published catalog available to anonymous visitors. Keep
    // authentication and student-owned enrollment checks on the session client.
    const admin = await requireAdminClient();
    const { data: program, error: programError } = await admin
      .from('programs')
      .select(
        'id, title, slug, price, tuition, total_cost, status, funding_eligible, funding_confirmed, wioa_approved, etpl_listed, is_free',
      )
      .eq('id', program_id)
      .eq('published', true)
      .eq('is_active', true)
      .maybeSingle();

    if (programError) {
      logger.error('Enrollment catalog lookup failed', programError);
      return NextResponse.json(
        { error: 'Program details are temporarily unavailable. Please try again.' },
        { status: 503 },
      );
    }
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    if (program.status !== 'active') {
      return NextResponse.json(
        { error: 'Program is not available for enrollment' },
        { status: 400 },
      );
    }

    // Check for existing active enrollment
    const { data: existingEnrollment } = await supabase
      .from('program_enrollments')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('program_id', program_id)
      .in('status', ['active', 'pending', 'checkout_pending'])
      .maybeSingle();

    if (existingEnrollment && existingEnrollment.status !== 'checkout_pending') {
      return NextResponse.json(
        { error: 'You are already enrolled in this program' },
        { status: 409 },
      );
    }

    // Calculate amount based on funding source
    const stickerPrice = Number(program.price ?? program.tuition ?? program.total_cost ?? 0);
    if (funding_source === 'self_pay' && stickerPrice <= 0 && program.is_free !== true) {
      return NextResponse.json(
        {
          error:
            'Tuition is not published for this program yet. Contact admissions before checkout.',
        },
        { status: 409 },
      );
    }
    const agencyFundingRequested = funding_source !== 'self_pay';
    if (
      agencyFundingRequested &&
      !program.funding_confirmed &&
      !program.wioa_approved &&
      !program.etpl_listed
    ) {
      return NextResponse.json(
        {
          error:
            'This program does not have a verified agency-funded checkout path. Choose self-pay or contact admissions.',
        },
        { status: 409 },
      );
    }
    // A funding request is not a payment authorization. Keep the enrollment
    // pending until staff records the agency's written authorization.
    const amountToCharge = agencyFundingRequested ? 0 : stickerPrice;

    const partnerProgram =
      ENCHANTED_HEARTS.programs.find((item) => item.programId === program.id) ?? null;
    if (
      ['enchanted-hearts', 'healthcare-training'].includes(partner_key || '') &&
      !partnerProgram
    ) {
      return NextResponse.json(
        { error: 'This program is not assigned to that partner.' },
        { status: 400 },
      );
    }
    if (
      partnerProgram &&
      !agencyFundingRequested &&
      (payment_plan !== 'full' || coupon_code.trim())
    ) {
      return NextResponse.json(
        { error: 'This program requires full tuition payment without a promotion code.' },
        { status: 400 },
      );
    }
    let fullAmountCents = agencyFundingRequested
      ? 0
      : (partnerProgram?.retailPriceCents ?? Math.round(amountToCharge * 100));
    let appliedCoupon: { code: string; discountAmountCents: number } | null = null;
    if (coupon_code.trim() && funding_source === 'self_pay') {
      const result = await resolveQuickBooksProgramPromotion({
        admin,
        code: coupon_code,
        amountCents: fullAmountCents,
        maximumDiscountCents: partnerProgram
          ? partnerProgram.retailPriceCents - partnerProgram.providerShareCents
          : undefined,
      });
      if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
      appliedCoupon = result.promotion;
      fullAmountCents -= appliedCoupon.discountAmountCents;
    }
    const amountCents =
      funding_source === 'self_pay' && payment_plan === 'installments'
        ? Math.ceil(fullAmountCents / 4)
        : fullAmountCents;

    // Get user profile for customer details
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .maybeSingle();

    const customerEmail = profile?.email || user.email || '';

    const lmsUrl = (
      process.env.NEXT_PUBLIC_LMS_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://app.elevateforhumanity.org'
    ).replace(/\/$/, '');

    const partnerHolderId = partnerProgram ? ENCHANTED_HEARTS.programHolderId : null;
    if (partnerHolderId) {
      const { data: assignment } = await admin
        .from('program_holder_programs')
        .select('id')
        .eq('program_holder_id', partnerHolderId)
        .eq('program_id', program.id)
        .eq('status', 'active')
        .maybeSingle();
      if (!assignment) {
        return NextResponse.json(
          { error: 'Partner assignment is not active yet.' },
          { status: 409 },
        );
      }
    }
    const pending =
      existingEnrollment?.status === 'checkout_pending'
        ? { data: { id: existingEnrollment.id }, error: null }
        : await admin
            .from('program_enrollments')
            .insert({
              program_id: program.id,
              program_slug: program.slug,
              student_id: user.id,
              user_id: user.id,
              email: customerEmail,
              full_name: profile?.full_name || customerEmail,
              funding_source,
              status: agencyFundingRequested
                ? 'pending'
                : amountCents > 0
                  ? 'checkout_pending'
                  : 'active',
              payment_status: agencyFundingRequested
                ? 'authorization_pending'
                : amountCents > 0
                  ? 'pending'
                  : 'paid',
              enrollment_state: agencyFundingRequested
                ? 'funding_authorization_pending'
                : amountCents > 0
                  ? 'payment_pending'
                  : 'active',
              next_required_action: agencyFundingRequested
                ? 'FUNDING_AUTHORIZATION'
                : amountCents > 0
                  ? 'PAYMENT'
                  : 'ONBOARDING',
              amount_paid_cents: 0,
              billing_provider: amountCents > 0 ? 'quickbooks' : null,
              program_holder_id: partnerHolderId,
            })
            .select('id')
            .single();
    if (pending.error || !pending.data)
      throw new Error(pending.error?.message || 'Enrollment could not be prepared.');

    if (agencyFundingRequested) {
      return NextResponse.json({
        success: true,
        authorization_pending: true,
        url: `${lmsUrl}/lms/dashboard?funding=authorization-pending`,
        enrollment_id: pending.data.id,
      });
    }
    if (amountCents === 0) {
      return NextResponse.json({
        success: true,
        url: `${lmsUrl}/lms/dashboard?enrollment=created`,
        enrollment_id: pending.data.id,
      });
    }

    if (!customerEmail) throw new Error('An email address is required for a QuickBooks invoice.');
    if (paymentMethod === 'affirm' && payment_plan !== 'full')
      return NextResponse.json(
        { error: 'Choose full tuition for Affirm checkout.' },
        { status: 400 },
      );
    if (paymentMethod === 'affirm') {
      if (!isAffirmInvoiceAmount(amountCents))
        return NextResponse.json(
          { error: 'This amount is not eligible for Affirm financing.' },
          { status: 400 },
        );
      await hydrateProcessEnv();
      affirm.tryLateConfig();
      if (!affirm.isConfigured())
        return NextResponse.json(
          { error: 'Affirm is temporarily unavailable. Please choose QuickBooks payment.' },
          { status: 503 },
        );
    }
    const invoice = await createQuickBooksBillingProvider(admin).createManualInvoice({
      idempotencyKey: `program:${pending.data.id}`,
      customer: {
        externalKey: `user:${user.id}`,
        displayName: profile?.full_name || customerEmail,
        email: customerEmail,
      },
      lines: [
        {
          canonicalKey: `program-${program.slug}`,
          name: program.title,
          description: appliedCoupon
            ? `Enrollment in ${program.title} · coupon ${appliedCoupon.code}`
            : `Enrollment in ${program.title}`,
          quantity: 1,
          unitAmountCents: amountCents,
        },
      ],
      dueDate: new Date().toISOString().slice(0, 10),
      memo: `Program enrollment ${pending.data.id}`,
      fulfillment: {
        type: 'program_enrollment',
        payload: {
          enrollment_id: pending.data.id,
          amount_cents: amountCents,
          program_id: program.id,
          student_id: user.id,
          program_holder_id: partnerHolderId,
          coupon_code: appliedCoupon?.code || null,
          discount_amount_cents: appliedCoupon?.discountAmountCents || 0,
        },
      },
    });
    if (!invoice.paymentUrl && paymentMethod === 'quickbooks')
      throw new Error('QuickBooks created the invoice but online payment links are not enabled.');
    // School invoice liabilities are recorded by confirmed-payment fulfillment,
    // separately from the graduation/PayPal payout workflow.
    if (payment_plan === 'installments') {
      const next = new Date();
      next.setUTCMonth(next.getUTCMonth() + 1);
      const schedule = await admin.from('billing_schedules').upsert(
        {
          customer_external_key: `user:${user.id}`,
          customer_name: profile?.full_name || customerEmail,
          customer_email: customerEmail,
          canonical_product_key: `program-installments-${program.id}`,
          product_name: `${program.title} installment`,
          provider: 'quickbooks',
          amount_cents: amountCents,
          cadence: 'monthly',
          next_invoice_date: next.toISOString().slice(0, 10),
          remaining_invoices: 3,
          status: 'active',
          fulfillment_type: 'program_enrollment',
          fulfillment_payload: {
            enrollment_id: pending.data.id,
            amount_cents: amountCents,
            program_id: program.id,
            student_id: user.id,
          },
        },
        { onConflict: 'provider,customer_external_key,canonical_product_key' },
      );
      if (schedule.error)
        throw new Error(
          `Initial invoice created but installment schedule failed: ${schedule.error.message}`,
        );
    }

    logger.info('Program enrollment checkout created', {
      invoiceId: invoice.providerInvoiceId,
      programId: program.id,
      programSlug: program.slug,
      studentId: user.id,
      fundingSource: funding_source,
      amountCents,
    });

    return NextResponse.json({
      success: true,
      url:
        paymentMethod === 'affirm'
          ? `https://app.${PLATFORM_DEFAULTS.canonicalDomain}/account/payment-methods`
          : invoice.paymentUrl,
      invoice_id: invoice.providerInvoiceId,
      coupon: appliedCoupon,
    });
  } catch (error) {
    logger.error(
      'Program enrollment checkout error',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: 'Failed to create QuickBooks invoice' }, { status: 500 });
  }
}

/**
 * GET - Return API documentation
 */
export async function GET() {
  return NextResponse.json({
    name: 'Program Enrollment Checkout API',
    description: 'Canonical endpoint for all program enrollments',
    method: 'POST',
    authentication: 'Required (user must be logged in)',
    request: {
      program_id: 'UUID - Required - The program ID from programs.id',
      funding_source:
        'Optional - One of: self_pay, workone, wioa, grant, employer (default: self_pay)',
    },
    response: {
      success: 'boolean',
      url: 'QuickBooks Pay Now URL to redirect the user',
      invoice_id: 'QuickBooks invoice ID for tracking',
    },
    webhook_provisioning:
      'When QuickBooks reports the invoice paid, the pending enrollment becomes active.',
  });
}
