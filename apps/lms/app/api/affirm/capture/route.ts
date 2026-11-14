import { NextRequest, NextResponse } from 'next/server';
import { affirm } from '@/lib/affirm/client';
import { getAdminClient } from '@/lib/supabase/admin';
import { resolveProgram } from '@/lib/programs/resolve';
import { createEnrollmentFromPayment } from '@/lib/enrollment/create-enrollment';
import { getProgramBySlug } from '@/data/programs/catalog';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function redirectToCheckout(
  request: NextRequest,
  program: string,
  applicationId: string,
  reason: string,
) {
  const url = new URL(`/checkout/${encodeURIComponent(program)}`, request.url);
  url.searchParams.set('method', 'affirm');
  url.searchParams.set('applicationId', applicationId);
  url.searchParams.set('payment_error', reason);
  return NextResponse.redirect(url, 303);
}

function redirectToSuccess(
  request: NextRequest,
  program: string,
  applicationId: string,
  enrollmentId?: string,
) {
  const url = new URL('/checkout/success', request.url);
  url.searchParams.set('program', program);
  url.searchParams.set('applicationId', applicationId);
  url.searchParams.set('provider', 'affirm');
  if (enrollmentId) url.searchParams.set('enrollmentId', enrollmentId);
  return NextResponse.redirect(url, 303);
}

function expectedPriceCents(programSlug: string): number | null {
  const program = getProgramBySlug(programSlug);
  if (!program?.selfPayCost) return null;
  const dollars = Number.parseInt(program.selfPayCost.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(dollars) && dollars > 0 ? dollars * 100 : null;
}

/**
 * Finalizes an Affirm checkout after the browser receives checkout_token.
 * The application ID is mandatory so a financed payment cannot be detached
 * from the applicant/enrollment it is intended to fund. The canonical shared
 * payment enrollment activator remains the only code that creates enrollment.
 */
export async function GET(request: NextRequest) {
  const checkoutToken = request.nextUrl.searchParams.get('checkout_token')?.trim() || '';
  const orderId = request.nextUrl.searchParams.get('order_id')?.trim() || '';
  const applicationId = request.nextUrl.searchParams.get('applicationId')?.trim() || '';
  const program = request.nextUrl.searchParams.get('program')?.trim() || '';

  if (!checkoutToken || checkoutToken.length < 8 || checkoutToken.length > 256) {
    return NextResponse.json({ error: 'Invalid Affirm checkout token' }, { status: 400 });
  }
  if (!program || program.length > 120 || !UUID_RE.test(applicationId)) {
    return NextResponse.json({ error: 'Invalid enrollment context' }, { status: 400 });
  }

  const expectedOrderPrefix = `${program}--${applicationId}--`;
  if (!orderId.startsWith(expectedOrderPrefix) || orderId.length > 128) {
    return redirectToCheckout(request, program, applicationId, 'invalid_order');
  }

  affirm.tryLateConfig();
  if (!affirm.isConfigured()) {
    logger.error('[Affirm capture] Affirm API keys are not configured');
    return redirectToCheckout(request, program, applicationId, 'configuration');
  }

  const supabase = await getAdminClient();
  if (!supabase) {
    logger.error('[Affirm capture] Supabase admin client unavailable');
    return redirectToCheckout(request, program, applicationId, 'service_unavailable');
  }

  try {
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select(
        'id,email,first_name,last_name,phone,program_interest,program_slug,payment_status,payment_provider,payment_reference,payment_amount_cents',
      )
      .eq('id', applicationId)
      .maybeSingle();

    if (applicationError || !application?.email) {
      logger.warn('[Affirm capture] Application not found', {
        applicationId,
        error: applicationError?.message,
      });
      return redirectToCheckout(request, program, applicationId, 'application_not_found');
    }

    const requestedProgram = await resolveProgram(supabase, program);
    const applicationProgram = await resolveProgram(
      supabase,
      application.program_slug || application.program_interest,
    );

    if (!requestedProgram || !applicationProgram || requestedProgram.id !== applicationProgram.id) {
      logger.warn('[Affirm capture] Program/application mismatch', {
        applicationId,
        requestedProgram: requestedProgram?.id,
        applicationProgram: applicationProgram?.id,
      });
      return redirectToCheckout(request, program, applicationId, 'program_mismatch');
    }

    if (
      application.payment_status === 'paid' &&
      application.payment_provider === 'affirm' &&
      application.payment_reference
    ) {
      return redirectToSuccess(request, program, applicationId);
    }

    const expectedAmount = expectedPriceCents(program);
    if (!expectedAmount) {
      logger.error('[Affirm capture] No canonical self-pay price found', undefined, { program });
      return redirectToCheckout(request, program, applicationId, 'price_unavailable');
    }

    const authorized = await affirm.authorizeCharge(checkoutToken, orderId);

    if (authorized.amount !== expectedAmount || authorized.currency !== 'USD') {
      logger.error('[Affirm capture] Authorized amount mismatch', undefined, {
        applicationId,
        program,
        expectedAmount,
        authorizedAmount: authorized.amount,
        currency: authorized.currency,
        chargeId: authorized.id,
      });
      try {
        await affirm.voidCharge(authorized.id);
      } catch (voidError) {
        logger.error('[Affirm capture] Failed to void mismatched authorization', voidError, {
          chargeId: authorized.id,
        });
      }
      return redirectToCheckout(request, program, applicationId, 'amount_mismatch');
    }

    const captured = await affirm.captureCharge(authorized.id, orderId, expectedAmount);

    const enrollment = await createEnrollmentFromPayment({
      programId: requestedProgram.id,
      programSlug: requestedProgram.slug,
      email: application.email,
      firstName: application.first_name || undefined,
      lastName: application.last_name || undefined,
      phone: application.phone || undefined,
      fundingSource: 'self_pay',
      applicationId,
      paymentProvider: 'affirm',
      paymentReference: captured.id || authorized.id,
      paymentAmountCents: expectedAmount,
    });

    if (!enrollment.success) {
      logger.error('[Affirm capture] Enrollment activation failed after capture', undefined, {
        applicationId,
        program,
        chargeId: captured.id || authorized.id,
        enrollmentError: enrollment.error,
      });
      return redirectToCheckout(request, program, applicationId, 'enrollment_review_required');
    }

    logger.info('[Affirm capture] Payment captured and enrollment recorded', {
      applicationId,
      program,
      chargeId: captured.id || authorized.id,
      enrollmentId: enrollment.enrollmentId,
    });

    return redirectToSuccess(request, program, applicationId, enrollment.enrollmentId);
  } catch (error) {
    logger.error('[Affirm capture] Payment finalization failed', error, {
      applicationId,
      program,
      orderId,
    });
    return redirectToCheckout(request, program, applicationId, 'payment_failed');
  }
}
