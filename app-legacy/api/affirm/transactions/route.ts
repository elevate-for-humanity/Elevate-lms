// PUBLIC ROUTE: Affirm payment webhook — processes charges server-to-server.
// Auth is verified via Affirm API keys (server-side), not user session.
// pre-auth-registry: exempt — Affirm webhook, no user_id at write time by design.
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { apiAuthGuard } from '@/lib/admin/guards';
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const AFFIRM_API_URL = 'https://api.affirm.com/api/v1';
const AFFIRM_PUBLIC_KEY = process.env.AFFIRM_PUBLIC_KEY ?? '';
const AFFIRM_PRIVATE_KEY = process.env.AFFIRM_PRIVATE_KEY ?? '';

function getAuthHeader(): string | null {
  if (!AFFIRM_PUBLIC_KEY || !AFFIRM_PRIVATE_KEY) return null;
  const auth = Buffer.from(`${AFFIRM_PUBLIC_KEY}:${AFFIRM_PRIVATE_KEY}`).toString('base64');
  return `Basic ${auth}`;
}

// Authorize (capture) a transaction
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;
  try {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      return NextResponse.json({ error: 'Affirm API keys not configured' }, { status: 503 });
    }
    const authResult = await apiAuthGuard(request);
    if (authResult.error) return authResult.error;
    const userId = authResult.id;
    const body = await parseBody<Record<string, any>>(request);
    const { checkout_token, order_id, action = 'authorize' } = body;

    if (!checkout_token) {
      return NextResponse.json({ error: 'checkout_token is required' }, { status: 400 });
    }

    switch (action) {
      case 'authorize': {
        // Authorize the transaction
        const response = await fetch(`${AFFIRM_API_URL}/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader!,
          },
          body: JSON.stringify({
            checkout_token,
            order_id: order_id || `EFH-${Date.now()}`,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          logger.error('Affirm transaction authorization error:', errorData);
          return NextResponse.json(
            { error: 'Failed to authorize transaction', details: errorData },
            { status: response.status },
          );
        }

        const data = await response.json();

        logger.info('Affirm transaction authorized:', {
          transaction_id: data.id,
          user_id: userId,
          amount: data.amount,
        });

        return NextResponse.json({
          transaction_id: data.id,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          created: data.created,
          order_id: data.order_id,
        });
      }

      case 'capture': {
        // Capture a previously authorized transaction
        const { transaction_id, amount, order_id: captureOrderId } = body;

        if (!transaction_id) {
          return NextResponse.json(
            { error: 'transaction_id is required for capture' },
            { status: 400 },
          );
        }

        const response = await fetch(`${AFFIRM_API_URL}/transactions/${transaction_id}/capture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader!,
          },
          body: JSON.stringify({
            order_id: captureOrderId,
            ...(amount && { amount }),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          logger.error('Affirm transaction capture error:', errorData);
          return NextResponse.json(
            { error: 'Failed to capture transaction', details: errorData },
            { status: response.status },
          );
        }

        const data = await response.json();

        logger.info('Affirm transaction captured:', {
          transaction_id: data.id,
          user_id: userId,
        });

        return NextResponse.json(data);
      }

      case 'void': {
        // Void a transaction
        const { transaction_id } = body;

        if (!transaction_id) {
          return NextResponse.json(
            { error: 'transaction_id is required for void' },
            { status: 400 },
          );
        }

        const response = await fetch(`${AFFIRM_API_URL}/transactions/${transaction_id}/void`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader!,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          logger.error('Affirm transaction void error:', errorData);
          return NextResponse.json(
            { error: 'Failed to void transaction', details: errorData },
            { status: response.status },
          );
        }

        const data = await response.json();

        logger.info('Affirm transaction voided:', {
          transaction_id: data.id,
          user_id: userId,
        });

        return NextResponse.json(data);
      }

      case 'refund': {
        // Refund a transaction
        const { transaction_id, amount: refundAmount } = body;

        if (!transaction_id) {
          return NextResponse.json(
            { error: 'transaction_id is required for refund' },
            { status: 400 },
          );
        }

        const response = await fetch(`${AFFIRM_API_URL}/transactions/${transaction_id}/refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader!,
          },
          body: JSON.stringify({
            ...(refundAmount && { amount: refundAmount }),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          logger.error('Affirm transaction refund error:', errorData);
          return NextResponse.json(
            { error: 'Failed to refund transaction', details: errorData },
            { status: response.status },
          );
        }

        const data = await response.json();

        logger.info('Affirm transaction refunded:', {
          transaction_id: data.id,
          user_id: userId,
          amount: refundAmount,
        });

        return NextResponse.json(data);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: authorize, capture, void, or refund' },
          { status: 400 },
        );
    }
  } catch (error) {
    /* Error handled silently */
    logger.error('Affirm transaction error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process transaction',
      },
      { status: 500 },
    );
  }
}

// Get transaction details
export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      return NextResponse.json({ error: 'Affirm API keys not configured' }, { status: 503 });
    }
    const authResult = await apiAuthGuard(request);
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(request.url);
    const transaction_id = searchParams.get('transaction_id');

    if (!transaction_id) {
      return NextResponse.json({ error: 'transaction_id is required' }, { status: 400 });
    }

    const response = await fetch(`${AFFIRM_API_URL}/transactions/${transaction_id}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader!,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('Affirm get transaction error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get transaction', details: errorData },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    /* Error handled silently */
    logger.error('Affirm get transaction error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get transaction',
      },
      { status: 500 },
    );
  }
}
