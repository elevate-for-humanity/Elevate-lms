#!/usr/bin/env npx tsx
/**
 * Run weekly barber apprentice billing:
 *   - Jordan + Natalia → Stripe (subscription + open invoices)
 *   - Mercedes → cash recorded in barber_payments / dashboards
 *
 * Requires live keys (hydrated from platform_secrets / app_secrets):
 *   STRIPE_SECRET_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *
 * Usage:
 *   pnpm tsx scripts/run-apprentice-stripe-billing.ts
 *   pnpm tsx scripts/run-apprentice-stripe-billing.ts --weekly
 *   pnpm tsx scripts/run-apprentice-stripe-billing.ts --customer cus_UGFxoJKjtlNoy8
 *   pnpm tsx scripts/run-apprentice-stripe-billing.ts --cash cus_UG4BIa05facQez
 *   pnpm tsx scripts/run-apprentice-stripe-billing.ts --subscription-only
 */

import Stripe from 'stripe';
import { hydrateProcessEnv } from '../lib/secrets';
import {
  BARBER_CASH_WEEKLY_CUSTOMER,
  BARBER_STRIPE_WEEKLY_CUSTOMERS,
  recordApprenticeCashPayment,
  runApprenticeStripeBilling,
  runWeeklyApprenticePayments,
} from '../lib/barber/apprentice-stripe-billing';

async function main() {
  await hydrateProcessEnv();

  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY || '';
  if (!stripeKey.startsWith('sk_') && !stripeKey.startsWith('rk_')) {
    console.error('STRIPE_SECRET_KEY not available after hydrateProcessEnv.');
    process.exit(1);
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion,
  });

  const args = process.argv.slice(2);
  const customerIdx = args.indexOf('--customer');
  const cashIdx = args.indexOf('--cash');
  const subscriptionOnly = args.includes('--subscription-only');
  const invoicesOnly = args.includes('--invoices-only');
  const weekly = args.includes('--weekly') || args.length === 0;

  let results;

  if (cashIdx >= 0 && args[cashIdx + 1]) {
    results = [await recordApprenticeCashPayment(args[cashIdx + 1])];
  } else if (weekly && customerIdx < 0) {
    console.log('Weekly run: Stripe (Jordan + Natalia) + cash (Mercedes)\n');
    results = await runWeeklyApprenticePayments(stripe);
  } else {
    const customerIds =
      customerIdx >= 0 && args[customerIdx + 1] ? [args[customerIdx + 1]] : undefined;
    const actions = subscriptionOnly
      ? (['ensure_subscription'] as const)
      : invoicesOnly
        ? (['pay_open_invoices'] as const)
        : (['ensure_subscription', 'pay_open_invoices'] as const);

    results = await runApprenticeStripeBilling(stripe, {
      customerIds,
      actions: [...actions],
    });

    if (args.includes('--with-mercedes-cash')) {
      results.push(await recordApprenticeCashPayment(BARBER_CASH_WEEKLY_CUSTOMER));
    }
  }

  for (const r of results) {
    const icon = r.ok ? '✅' : '❌';
    console.log(`${icon} ${r.name} (${r.customerId}) — ${r.action}: ${r.detail}`);
    if (r.subscriptionId) console.log(`   subscription: ${r.subscriptionId}`);
    if (r.invoiceId) console.log(`   invoice: ${r.invoiceId}`);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error('\nFailed:', failed.map((f) => f.name).join(', '));
    process.exit(1);
  }

  console.log('\nTargets:', {
    stripe: [...BARBER_STRIPE_WEEKLY_CUSTOMERS],
    cash: BARBER_CASH_WEEKLY_CUSTOMER,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
