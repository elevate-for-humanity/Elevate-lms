import { z } from 'zod';
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

const connectCreateSchema = z.object({
  employer_id: z.string().uuid(),
});

async function createConnectAccount(request: Request) {
  try {
    const auth = await apiRequireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const parsed = connectCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
        },
        { status: 400 },
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: 'Payment processing not configured' }, { status: 503 });

    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: { transfers: { requested: true } },
    });

    const db = await requireAdminClient();
    const { error } = await db.from('billing_accounts').insert({
      employer_id: parsed.data.employer_id,
      stripe_account_id: account.id,
      onboarding_completed: false,
    });

    if (error) return NextResponse.json({ error: 'Failed to save account' }, { status: 500 });
    return NextResponse.json({ accountId: account.id });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createConnectOnboardingLink(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { accountId } = await request.json();
    if (typeof accountId !== 'string' || !accountId.trim()) {
      return NextResponse.json({ error: 'accountId required' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: 'Payment processing not configured' }, { status: 503 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: process.env.STRIPE_REFRESH_URL || `${siteUrl}/employers/billing/refresh`,
      return_url: process.env.STRIPE_RETURN_URL || `${siteUrl}/employers/billing/complete`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: link.url });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createInvoice(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { employer_id, customerId, amount, description } = await request.json();
    if (
      typeof employer_id !== 'string' ||
      typeof customerId !== 'string' ||
      typeof amount !== 'number' ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      typeof description !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid invoice request' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const allowedDescriptions = ['admin', 'platform', 'compliance', 'coordination', 'supervision'];
    if (!allowedDescriptions.some((keyword) => description.toLowerCase().includes(keyword))) {
      return NextResponse.json(
        { error: 'Invalid invoice description. Only admin/platform/compliance fees allowed.' },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: 'Payment processing not configured' }, { status: 503 });

    await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(amount * 100),
      currency: 'usd',
      description,
    });
    const invoice = await stripe.invoices.create({ customer: customerId, auto_advance: true });

    const db = await requireAdminClient();
    const { data, error } = await db
      .from('invoices')
      .insert({
        employer_id,
        amount,
        description,
        status: 'pending',
        stripe_invoice_id: invoice.id,
      })
      .select()
      .maybeSingle();

    if (error) return NextResponse.json({ error: 'Failed to save invoice' }, { status: 500 });
    return NextResponse.json({ invoice: data, stripeInvoice: invoice });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function listInvoices(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db.from('invoices').select('*');
    if (error) return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    return NextResponse.json({ invoices: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const postConnectCreate = withRuntime(withApiAudit('/api/stripe/connect/create', createConnectAccount));
export const postConnectOnboard = withRuntime(withApiAudit('/api/stripe/connect/onboard', createConnectOnboardingLink));
export const getInvoices = withRuntime(withApiAudit('/api/stripe/invoice/create', listInvoices));
export const postInvoice = withRuntime(withApiAudit('/api/stripe/invoice/create', createInvoice));
