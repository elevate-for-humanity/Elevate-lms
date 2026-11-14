import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createWeeklySubscriptionAfterCheckout } from '@/lib/enrollment/create-weekly-subscription-after-checkout';

/**
 * Barber apprenticeship weekly billing after checkout.
 */
export async function createBarberWeeklySubscriptionAfterCheckout(params: {
  stripe: Stripe;
  supabase: SupabaseClient;
  session: Stripe.Checkout.Session;
  customerId: string;
  customerEmail: string;
  applicationId?: string;
  weeklyPaymentCents: number;
  invoiceWeeks: number;
  fullyPaid: boolean;
  bnplProvider?: string | null;
}) {
  return createWeeklySubscriptionAfterCheckout({
    ...params,
    subscriptionsTable: 'barber_subscriptions',
    productName: 'Barber Apprenticeship — Weekly Tuition',
    programSlug: 'barber-apprenticeship',
  });
}
