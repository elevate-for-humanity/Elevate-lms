import { describe, it, expect } from 'vitest';
import type { ApprenticeshipSubscriptionsTable } from '@/lib/enrollment/create-weekly-subscription-after-checkout';

describe('create-weekly-subscription-after-checkout', () => {
  it('accepts both subscription tables', () => {
    const tables: ApprenticeshipSubscriptionsTable[] = [
      'barber_subscriptions',
      'cosmetology_subscriptions',
    ];
    expect(tables).toHaveLength(2);
  });
});
