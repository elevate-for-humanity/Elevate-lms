/**
 * Vendor Payout System
 *
 * After a student pays Elevate for a partner course, this module handles
 * paying the vendor their wholesale cost. The margin stays in Elevate's
 * Stripe account.
 *
 * Payout methods by vendor:
 * - Stripe Connect transfer (vendors with connected accounts)
 * - Recorded as payable (vendors paid via invoice/ACH outside Stripe)
 *
 * All payouts are logged to `vendor_payouts` for reconciliation.
 */

import { getStripe } from '@/lib/stripe/client';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export interface VendorPayoutRequest {
  enrollmentId: string;
  courseId: string;
  providerId: string;
  providerName: string;
  wholesaleCostCents: number;
  retailPriceCents: number;
  stripePaymentIntentId: string;
  studentId: string;
  studentEmail: string;
  courseName: string;
}

export interface VendorPayoutResult {
  success: boolean;
  payoutId?: string;
  method: 'stripe_transfer' | 'recorded_payable' | 'prepaid_license';
  error?: string;
}

// Vendors with Stripe Connect accounts get automatic transfers.
// Key = provider_type (lowercase), value = Stripe connected account ID.
// Populated from partner_lms_providers.stripe_connect_account_id in DB.
const STRIPE_CONNECT_ACCOUNTS: Record<string, string> = {};

/**
 * Process vendor payout after student payment completes.
 * Called from the Stripe webhook handler.
 */
export async function processVendorPayout(
  request: VendorPayoutRequest
): Promise<VendorPayoutResult> {
  const supabase = await getAdminClient();
  if (!supabase) {
    return { success: false, method: 'recorded_payable', error: 'Database unavailable' };
  }

  const stripe = getStripe();
  const marginCents = request.retailPriceCents - request.wholesaleCostCents;

  try {
    // Check if payout already processed (idempotency)
    const { data: existing } = await supabase
      .from('vendor_payouts')
      .select('id')
      .eq('enrollment_id', request.enrollmentId)
      .eq('provider_id', request.providerId)
      .maybeSingle();

    if (existing) {
      logger.info('[vendor-payout] Already processed for enrollment:', request.enrollmentId);
      return { success: true, payoutId: existing.id, method: 'recorded_payable' };
    }

    // Check if vendor has a Stripe Connect account
    const { data: provider } = await supabase
      .from('partner_lms_providers')
      .select('stripe_connect_account_id, payout_method')
      .eq('id', request.providerId)
      .maybeSingle();

    const connectAccountId = provider?.stripe_connect_account_id;
    let method: VendorPayoutResult['method'] = 'recorded_payable';
    let stripeTransferId: string | null = null;

    if (connectAccountId && stripe && request.wholesaleCostCents > 0) {
      // Stripe Connect transfer — vendor gets paid automatically
      try {
        const transfer = await stripe.transfers.create({
          amount: request.wholesaleCostCents,
          currency: 'usd',
          destination: connectAccountId,
          transfer_group: `enrollment_${request.enrollmentId}`,
          source_transaction: request.stripePaymentIntentId,
          description: `${request.courseName} — vendor payout for ${request.studentEmail}`,
          metadata: {
            enrollment_id: request.enrollmentId,
            course_id: request.courseId,
            provider_id: request.providerId,
            provider_name: request.providerName,
            student_id: request.studentId,
          },
        });
        stripeTransferId = transfer.id;
        method = 'stripe_transfer';
        logger.info('[vendor-payout] Stripe transfer created:', transfer.id);
      } catch (transferErr) {
        // Non-fatal: fall back to recorded payable
        logger.error('[vendor-payout] Stripe transfer failed, recording as payable:',
          transferErr instanceof Error ? transferErr : new Error(String(transferErr)));
        method = 'recorded_payable';
      }
    }

    // Record payout in DB
    const { data: payout, error: payoutError } = await supabase
      .from('vendor_payouts')
      .insert({
        enrollment_id: request.enrollmentId,
        course_id: request.courseId,
        provider_id: request.providerId,
        provider_name: request.providerName,
        student_id: request.studentId,
        wholesale_cost_cents: request.wholesaleCostCents,
        retail_price_cents: request.retailPriceCents,
        margin_cents: marginCents,
        stripe_payment_intent_id: request.stripePaymentIntentId,
        stripe_transfer_id: stripeTransferId,
        payout_method: method,
        status: method === 'stripe_transfer' ? 'completed' : 'pending',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (payoutError) {
      logger.error('[vendor-payout] DB insert error:', payoutError);
      return { success: false, method, error: 'Failed to record payout' };
    }

    logger.info(`[vendor-payout] ${method}: $${(request.wholesaleCostCents / 100).toFixed(2)} to ${request.providerName}, margin $${(marginCents / 100).toFixed(2)}`);

    return {
      success: true,
      payoutId: payout?.id,
      method,
    };
  } catch (err) {
    logger.error('[vendor-payout] Unexpected error:',
      err instanceof Error ? err : new Error(String(err)));
    return { success: false, method: 'recorded_payable', error: 'Payout processing failed' };
  }
}
