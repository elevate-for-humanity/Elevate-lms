import { NextResponse } from 'next/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * Legacy Store Stripe webhook endpoint.
 * New Store purchases are fulfilled by provider-neutral billing:
 * QuickBooks webhook -> billing_fulfillment_jobs -> fulfillment.ts.
 * Keep this route only as a fail-closed compatibility endpoint while old
 * provider webhook registrations are removed.
 */
async function _POST() {
  return NextResponse.json(
    {
      received: false,
      retired: true,
      provider: 'stripe',
      replacement: '/api/webhooks/quickbooks',
    },
    { status: 410 },
  );
}

export const POST = withApiAudit('/api/webhooks/store', _POST, {
  actor_type: 'webhook',
  skip_body: true,
});
