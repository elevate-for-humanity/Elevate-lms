/**
 * Sezzle Virtual Card Capture API
 * 
 * Captures a previously authorized Sezzle virtual card payment.
 * Use this when the checkout was created with intent: 'AUTH'
 * and you need to capture the funds later.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sezzle } from '@/lib/sezzle/client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

interface CaptureRequest {
  orderUuid: string;
  amountInCents: number;
  partialCapture?: boolean;
  referenceId?: string;
}

export async function POST(request: NextRequest) {
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
        { error: 'Sezzle is not configured' },
        { status: 503 }
      );
    }

    const body: CaptureRequest = await request.json();
    const { orderUuid, amountInCents, partialCapture = false, referenceId } = body;

    if (!orderUuid) {
      return NextResponse.json(
        { error: 'Missing orderUuid' },
        { status: 400 }
      );
    }

    if (!amountInCents || amountInCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid amountInCents' },
        { status: 400 }
      );
    }

    // Capture the payment
    const captureResult = await sezzle.captureOrder(orderUuid, amountInCents, partialCapture);

    logger.info('Sezzle virtual card payment captured', {
      orderUuid,
      amountInCents,
      partialCapture,
      referenceId,
    });

    // Update payment record if we have supabase
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (supabase && referenceId) {
      await db
        .from('payments')
        .update({
          status: 'captured',
          captured_at: new Date().toISOString(),
          captured_amount_cents: amountInCents,
        })
        .eq('reference_id', referenceId);
    }

    return NextResponse.json({
      ok: true,
      orderUuid,
      amountCaptured: amountInCents,
      partialCapture,
      captureResult,
    });
  } catch (error) {
    logger.error('Sezzle capture error:', error);
    const message = 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
