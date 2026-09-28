import {
  retiredSubscriptionWebhookGet,
  retiredSubscriptionWebhookPost,
} from '@/lib/billing/retired-subscription-webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// RETIRED compatibility URL. Keep the route present so old senders receive an
// explicit non-success response without advancing access or mutating billing.
export async function POST() {
  return retiredSubscriptionWebhookPost('/api/webhooks/subscriptions');
}

export async function GET() {
  return retiredSubscriptionWebhookGet('/api/webhooks/subscriptions');
}
