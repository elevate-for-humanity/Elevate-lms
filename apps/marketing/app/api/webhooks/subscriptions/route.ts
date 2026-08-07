import type { NextRequest } from 'next/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { handleSubscriptionWebhook } from '@/lib/platform/handle-subscription-webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _POST(request: NextRequest) {
  return handleSubscriptionWebhook(request);
}

export const POST = withApiAudit('/api/webhooks/subscriptions', _POST, {
  actor_type: 'webhook',
  skip_body: true,
});
