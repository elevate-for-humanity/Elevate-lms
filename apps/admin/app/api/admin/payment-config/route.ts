/**
 * Admin-only diagnostic endpoint — checks BNPL provider configuration status.
 * Returns which env vars are present (not their values).
 * Requires admin/admin/staff authentication.
 */

import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { handleRoute } from '@/lib/api/route';
import { sezzle } from '@/lib/sezzle/client';
import { affirm } from '@/lib/affirm/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  return handleRoute(async () => {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await apiRequireAdmin(request);

    if (auth.error) return auth.error;
    const response = NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      sezzle: {
        configured: sezzle.isConfigured(),
        envVars: {
          SEZZLE_PUBLIC_KEY: !!process.env.SEZZLE_PUBLIC_KEY,
          SEZZLE_PRIVATE_KEY: !!process.env.SEZZLE_PRIVATE_KEY,
          SEZZLE_ENVIRONMENT: process.env.SEZZLE_ENVIRONMENT || '(not set, defaults to sandbox)',
          SEZZLE_WEBHOOK_SECRET: !!process.env.SEZZLE_WEBHOOK_SECRET,
        },
      },
      affirm: {
        configured: affirm.isConfigured(),
        envVars: {
          AFFIRM_PUBLIC_KEY: !!process.env.AFFIRM_PUBLIC_KEY,
          NEXT_PUBLIC_AFFIRM_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY,
          AFFIRM_PRIVATE_KEY: !!process.env.AFFIRM_PRIVATE_KEY,
          AFFIRM_ENVIRONMENT: process.env.AFFIRM_ENVIRONMENT || '(not set, defaults to production)',
        },
      },
      paypal: {
        configured: Boolean(
          process.env.PAYPAL_CLIENT_ID &&
          process.env.PAYPAL_CLIENT_SECRET &&
          process.env.PAYPAL_PAYOUT_WEBHOOK_ID
        ),
        envVars: {
          PAYPAL_CLIENT_ID: !!process.env.PAYPAL_CLIENT_ID,
          PAYPAL_CLIENT_SECRET: !!process.env.PAYPAL_CLIENT_SECRET,
          PAYPAL_PAYOUT_WEBHOOK_ID: !!process.env.PAYPAL_PAYOUT_WEBHOOK_ID,
          PAYPAL_ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT || '(not set, defaults to sandbox)',
        },
      },
      quickbooks: {
        configured: Boolean(
          process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET
        ),
        envVars: {
          QUICKBOOKS_CLIENT_ID: !!process.env.QUICKBOOKS_CLIENT_ID,
          QUICKBOOKS_CLIENT_SECRET: !!process.env.QUICKBOOKS_CLIENT_SECRET,
          QUICKBOOKS_ENVIRONMENT:
            process.env.QUICKBOOKS_ENVIRONMENT || '(managed by the QuickBooks connection)',
        },
      },
      supabase: {
        envVars: {
          NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      },
    });

    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Vary', 'Authorization, Cookie');
    return response;
  });
}
export const GET = withRuntime(withApiAudit('/api/admin/payment-config', _GET));
