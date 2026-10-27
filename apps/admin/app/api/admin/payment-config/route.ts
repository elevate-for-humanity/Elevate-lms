/**
 * Admin-only diagnostic endpoint for the canonical billing stack.
 * Reports configuration presence only; secret values are never returned.
 */

import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { handleRoute } from '@/lib/api/route';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  return handleRoute(async () => {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await apiRequireAdmin(request);
    if (auth.error) return auth.error;

    const db = await requireAdminClient();
    const { data: quickBooksRows } = await db
      .from('app_settings')
      .select('key, value')
      .in('key', ['QB_CLIENT_ID', 'QB_CLIENT_SECRET', 'QB_ACCESS_TOKEN', 'QB_REFRESH_TOKEN', 'QB_REALM_ID']);
    const quickBooksStored = Object.fromEntries(
      (quickBooksRows ?? []).map((row) => [row.key, row.value ?? '']),
    );
    const hasQuickBooksValue = (key: string) => Boolean(process.env[key] || quickBooksStored[key]);
    const quickBooksCredentialsConfigured =
      hasQuickBooksValue('QB_CLIENT_ID') && hasQuickBooksValue('QB_CLIENT_SECRET');
    const quickBooksConnected =
      quickBooksCredentialsConfigured &&
      hasQuickBooksValue('QB_REFRESH_TOKEN') &&
      hasQuickBooksValue('QB_REALM_ID');
    const payPalConfigured = Boolean(
      process.env.PAYPAL_CLIENT_ID &&
        process.env.PAYPAL_CLIENT_SECRET &&
        process.env.PAYPAL_BILLING_WEBHOOK_ID,
    );

    const response = NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      billing: {
        authority: 'admin_dashboard',
        dashboardPath: '/billing/subscriptions',
        automaticCollection: 'paypal',
        invoiceLedger: 'quickbooks',
        configured: payPalConfigured && quickBooksConnected,
      },
      paypal: {
        configured: payPalConfigured,
        environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
        envVars: {
          PAYPAL_CLIENT_ID: !!process.env.PAYPAL_CLIENT_ID,
          PAYPAL_CLIENT_SECRET: !!process.env.PAYPAL_CLIENT_SECRET,
          PAYPAL_BILLING_WEBHOOK_ID: !!process.env.PAYPAL_BILLING_WEBHOOK_ID,
        },
      },
      quickbooks: {
        configured: quickBooksCredentialsConfigured,
        connected: quickBooksConnected,
        envVars: {
          QB_CLIENT_ID: hasQuickBooksValue('QB_CLIENT_ID'),
          QB_CLIENT_SECRET: hasQuickBooksValue('QB_CLIENT_SECRET'),
          QB_ACCESS_TOKEN: hasQuickBooksValue('QB_ACCESS_TOKEN'),
          QB_REFRESH_TOKEN: hasQuickBooksValue('QB_REFRESH_TOKEN'),
          QB_REALM_ID: hasQuickBooksValue('QB_REALM_ID'),
        },
      },
      legacyPayments: {
        mode: 'archive_only',
        acceptsNewTransactions: false,
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
