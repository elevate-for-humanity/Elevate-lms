import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getStripe } from '@/lib/stripe/client';
import {
  BARBER_APPRENTICE_STRIPE_CUSTOMERS,
  runApprenticeStripeBilling,
  type ApprenticeBillingAction,
} from '@/lib/barber/apprentice-stripe-billing';

export const dynamic = 'force-dynamic';

const JORDAN_AND_NATALIA = ['cus_UGFxoJKjtlNoy8', 'cus_UTVa6pmsYlWBsp'] as const;

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  try {
    const results = await Promise.all(
      Object.entries(BARBER_APPRENTICE_STRIPE_CUSTOMERS).map(async ([customerId, meta]) => {
        const [charges, subscriptions, invoices] = await Promise.all([
          stripe.charges.list({ customer: customerId, limit: 50 }),
          stripe.subscriptions.list({ customer: customerId, limit: 10, status: 'all' } as any),
          stripe.invoices.list({ customer: customerId, limit: 50 }),
        ]);

        const totalPaidCents = charges.data
          .filter((c) => c.paid && c.status === 'succeeded')
          .reduce((sum, c) => sum + c.amount, 0);

        const activeSub = subscriptions.data.find((s) => s.status === 'active');
        const latestSub = subscriptions.data[0] ?? null;

        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        const weeksSinceStart = Math.floor(
          (Date.now() - new Date(meta.startDate).getTime()) / msPerWeek,
        );
        const week1Free = 1;
        const weeksBilled = Math.max(0, weeksSinceStart - week1Free);
        const totalScheduledCents = weeksBilled * meta.weeklyRateCents;
        const creditRemaining = Math.max(0, meta.downPaymentCents - totalScheduledCents);
        const weeksOfCreditLeft = Math.floor(creditRemaining / meta.weeklyRateCents);

        return {
          customerId,
          ...meta,
          totalPaidCents,
          totalPaidFormatted: formatCents(totalPaidCents),
          weeksBilled,
          totalScheduledCents,
          totalScheduledFormatted: formatCents(totalScheduledCents),
          creditRemainingCents: creditRemaining,
          creditRemainingFormatted: formatCents(creditRemaining),
          weeksOfCreditLeft,
          subscription: latestSub
            ? {
                id: latestSub.id,
                status: latestSub.status,
                isActive: latestSub.status === 'active',
                weeklyAmountCents: latestSub.items.data[0]?.price?.unit_amount ?? 0,
                weeklyAmountFormatted: formatCents(
                  latestSub.items.data[0]?.price?.unit_amount ?? 0,
                ),
                currentPeriodEnd: new Date(
                  (latestSub as any).current_period_end * 1000,
                ).toISOString(),
                created: new Date(latestSub.created * 1000).toISOString(),
              }
            : null,
          hasActiveSubscription: !!activeSub,
          charges: charges.data.map((c) => ({
            id: c.id,
            amountCents: c.amount,
            amountFormatted: formatCents(c.amount),
            status: c.status,
            paid: c.paid,
            created: new Date(c.created * 1000).toISOString(),
            description: c.description,
            receiptUrl: c.receipt_url,
            failureMessage: c.failure_message,
          })),
          invoices: invoices.data.map((i) => ({
            id: i.id,
            amountPaidCents: i.amount_paid,
            amountDueCents: i.amount_due,
            amountPaidFormatted: formatCents(i.amount_paid),
            status: i.status,
            paid: i.paid,
            created: new Date(i.created * 1000).toISOString(),
            description: i.description,
            hostedInvoiceUrl: i.hosted_invoice_url,
          })),
        };
      }),
    );

    return NextResponse.json({ students: results });
  } catch {
    return NextResponse.json({ error: 'Payment processing error' }, { status: 500 });
  }
}

/**
 * POST — run billing for Jordan White and Natalia Roa (default).
 * Body: { customerIds?: string[], actions?: ('ensure_subscription' | 'pay_open_invoices')[] }
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  let body: { customerIds?: string[]; actions?: ApprenticeBillingAction[] };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const customerIds = body.customerIds?.length ? body.customerIds : [...JORDAN_AND_NATALIA];

  try {
    const results = await runApprenticeStripeBilling(stripe, {
      customerIds,
      actions: body.actions,
    });
    const allOk = results.every((r) => r.ok);
    return NextResponse.json(
      { ok: allOk, results, customerIds },
      { status: allOk ? 200 : 207 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Billing run failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
