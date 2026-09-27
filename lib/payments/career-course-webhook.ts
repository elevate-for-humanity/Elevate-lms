import { NextResponse } from 'next/server';

export type CareerCourseWebhookResult = {
  handled: boolean;
  response?: Record<string, boolean>;
};

/**
 * Stripe career-course processing is retired. Historical webhook URLs remain
 * fail-closed so stale provider callbacks cannot mutate enrollment or billing.
 */
export async function processCareerCourseStripeEvent(): Promise<CareerCourseWebhookResult> {
  return { handled: true, response: { received: true, retired: true } };
}

export async function handleCareerCourseStripeWebhook(_req: Request) {
  return NextResponse.json({ received: true, retired: true }, { status: 410 });
}
