import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import {
  apprenticeshipIdempotencyKey,
  findExistingApprenticeshipSubscription,
} from '@/lib/stripe/subscription-guard';

function subscription(
  id: string,
  created: number,
  metadata: Record<string, string>,
  status: Stripe.Subscription.Status = 'trialing',
) {
  return { id, created, metadata, status } as Stripe.Subscription;
}

describe('apprenticeship subscription guard', () => {
  it('uses a stable key for every enrollment operation', () => {
    expect(apprenticeshipIdempotencyKey('subscription', 'enrollment-1')).toBe(
      'apprenticeship-subscription:enrollment-1',
    );
  });

  it('returns the latest live subscription for the exact enrollment', async () => {
    const list = vi.fn().mockResolvedValue({
      data: [
        subscription('sub_old', 10, { enrollment_id: 'enrollment-1' }),
        subscription('sub_cancelled', 30, { enrollment_id: 'enrollment-1' }, 'canceled'),
        subscription('sub_new', 20, { enrollment_id: 'enrollment-1' }),
      ],
    });
    const stripe = { subscriptions: { list } } as unknown as Stripe;

    const result = await findExistingApprenticeshipSubscription({
      stripe,
      customerId: 'cus_1',
      enrollmentId: 'enrollment-1',
      programSlug: 'cosmetology-apprenticeship',
    });

    expect(result?.id).toBe('sub_new');
  });

  it('does not adopt another enrollment just because the program matches', async () => {
    const list = vi.fn().mockResolvedValue({
      data: [
        subscription('sub_other', 10, {
          enrollment_id: 'enrollment-2',
          program_slug: 'cosmetology-apprenticeship',
          kind: 'apprenticeship_weekly_tuition',
        }),
      ],
    });
    const stripe = { subscriptions: { list } } as unknown as Stripe;

    const result = await findExistingApprenticeshipSubscription({
      stripe,
      customerId: 'cus_1',
      enrollmentId: 'enrollment-1',
      programSlug: 'cosmetology-apprenticeship',
    });

    expect(result).toBeNull();
  });
});
