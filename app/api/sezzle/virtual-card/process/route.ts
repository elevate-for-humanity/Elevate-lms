// PUBLIC ROUTE: Sezzle virtual card processing
/**
 * Sezzle Virtual Card Processing API
 * 
 * Handles the virtual card data returned from Sezzle SDK after customer
 * completes checkout. The virtual card can be:
 * 1. Tokenized (card_response_format: 'token') - safer, recommended
 * 2. Raw card data - PAN, CVV, expiry returned directly
 * 
 * Flow:
 * 1. Customer completes Sezzle checkout in popup
 * 2. SDK returns virtual card data via onComplete callback
 * 3. Frontend sends card token/data to this endpoint
 * 4. We capture the payment and create enrollment record
 */

import { NextRequest, NextResponse } from 'next/server';
import { sezzle } from '@/lib/sezzle/client';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { createEnrollmentFromPayment } from '@/lib/enrollment/create-enrollment';

interface VirtualCardProcessRequest {
  // Session info from Sezzle
  sessionId: string;
  orderUuid?: string;
  
  // Card data (tokenized or raw)
  cardToken?: string;
  cardData?: {
    firstName: string;
    lastName: string;
    pan: string;
    cvv: string;
    expiryMonth: string;
    expiryYear: string;
  };
  
  // Holder info
  holder?: {
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  
  // Order info
  referenceId: string;
  amountInCents: number;
  programSlug?: string;
  programName?: string;
  
  // Application/enrollment reference
  applicationId?: string;
  enrollmentId?: string;
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Lazy config re-check
    if (!sezzle.isConfigured() && process.env.SEZZLE_PUBLIC_KEY && process.env.SEZZLE_PRIVATE_KEY) {
      sezzle.configure({
        publicKey: process.env.SEZZLE_PUBLIC_KEY,
        privateKey: process.env.SEZZLE_PRIVATE_KEY,
        environment: (process.env.SEZZLE_ENVIRONMENT as 'sandbox' | 'production') || 'production',
      });
    }

    if (!sezzle.isConfigured()) {
      return NextResponse.json(
        { error: 'Sezzle is temporarily unavailable.' },
        { status: 503 }
      );
    }

    const body: VirtualCardProcessRequest = await request.json();
    const {
      sessionId,
      orderUuid,
      cardToken,
      cardData,
      holder,
      referenceId,
      amountInCents,
      programSlug,
      programName,
      applicationId,
      enrollmentId,
    } = body;

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId from Sezzle checkout' },
        { status: 400 }
      );
    }

    if (!cardToken && !cardData) {
      return NextResponse.json(
        { error: 'Missing card token or card data' },
        { status: 400 }
      );
    }

    if (!referenceId || !amountInCents) {
      return NextResponse.json(
        { error: 'Missing referenceId or amountInCents' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Log the virtual card checkout completion
    logger.info('Sezzle virtual card checkout completed', {
      sessionId,
      orderUuid,
      referenceId,
      amountInCents,
      hasToken: !!cardToken,
      hasCardData: !!cardData,
      programSlug,
    });

    // If we have an order UUID, capture the payment
    let captureResult = null;
    if (orderUuid) {
      try {
        captureResult = await sezzle.captureOrder(orderUuid, amountInCents, false);
        logger.info('Sezzle payment captured', {
          orderUuid,
          amountInCents,
          captureResult,
        });
      } catch (captureError) {
        logger.error('Sezzle capture failed', captureError);
        // Continue - the payment may already be captured if intent was CAPTURE
      }
    }

    // Generate internal order ID
    // Use randomBytes — Math.random() has collision risk for concurrent requests.
    const { randomBytes: _rb } = require('crypto') as typeof import('crypto');
    const internalOrderId = `ORD-${Date.now()}-${_rb(6).toString('hex')}`;

    // Store the payment record
    if (supabase) {
      // Update application if provided
      if (applicationId) {
        await supabase
          .from('applications')
          .update({
            sezzle_session_uuid: sessionId,
            sezzle_order_uuid: orderUuid,
            sezzle_reference_id: referenceId,
            payment_provider: 'sezzle_virtual_card',
            payment_status: 'completed',
            payment_amount_cents: amountInCents,
            payment_completed_at: new Date().toISOString(),
            internal_order_id: internalOrderId,
          })
          .eq('id', applicationId);
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          provider: 'sezzle_virtual_card',
          provider_session_id: sessionId,
          provider_order_id: orderUuid,
          reference_id: referenceId,
          internal_order_id: internalOrderId,
          amount_cents: amountInCents,
          currency: 'USD',
          status: 'completed',
          customer_email: holder?.email,
          customer_name: holder ? `${holder.firstName} ${holder.lastName}` : null,
          program_slug: programSlug,
          program_name: programName,
          application_id: applicationId,
          enrollment_id: enrollmentId,
          card_token: cardToken,
          metadata: {
            holder,
            capture_result: captureResult,
          },
          created_at: new Date().toISOString(),
        });

      if (paymentError) {
        logger.warn('Failed to create payment record', { error: paymentError });
        // Don't fail the request - payment was successful
      }

      // Create enrollment via the shared factory — handles user lookup/creation
      // and writes to program_enrollments with the correct schema (program_id, user_id).
      if (programSlug && holder?.email) {
        const adminDb = await getAdminClient();
        let programId: string | undefined;
        if (adminDb) {
          const { data: prog } = await adminDb
            .from('programs')
            .select('id')
            .eq('slug', programSlug)
            .maybeSingle();
          programId = prog?.id;
        }

        if (programId) {
          const result = await createEnrollmentFromPayment({
            programId,
            programSlug,
            email: holder.email,
            firstName: holder.firstName,
            lastName: holder.lastName,
            phone: holder.phone,
            applicationId,
            paymentProvider: 'sezzle_virtual_card',
            paymentReference: referenceId,
            paymentAmountCents: amountInCents,
            fundingSource: 'self_pay',
          });
          if (!result.success) {
            logger.warn('Failed to create enrollment from virtual card', { error: result.error });
          }
        } else {
          logger.warn('Sezzle virtual card: program not found for slug', { programSlug });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      orderId: internalOrderId,
      sessionId,
      orderUuid,
      referenceId,
      captured: !!captureResult,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    logger.error('Sezzle virtual card processing error:', error);
    const message = 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/sezzle/virtual-card/process', _POST);
