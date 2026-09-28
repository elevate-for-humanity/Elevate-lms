import { NextResponse } from 'next/server';

export function retiredSubscriptionWebhookPost(legacyRoute: string) {
  return NextResponse.json(
    {
      error: 'Legacy subscription webhook is unavailable.',
      legacyRoute,
      retired: true,
    },
    { status: 503 },
  );
}

export function retiredSubscriptionWebhookGet(legacyRoute: string) {
  return NextResponse.json(
    {
      error: 'Legacy subscription webhook is unavailable.',
      legacyRoute,
      retired: true,
    },
    { status: 410 },
  );
}
