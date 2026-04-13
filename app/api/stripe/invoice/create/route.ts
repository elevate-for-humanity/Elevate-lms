// PUBLIC ROUTE: Stripe invoice creation — admin only
import { apiRequireAdmin } from '@/lib/admin/guards';


import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { employer_id, customerId, amount, description } = body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Compliance check: Only allow admin/platform/compliance fees
    const allowedDescriptions = [
      'admin',
      'platform',
      'compliance',
      'coordination',
      'supervision',
    ];
    const isAllowed = allowedDescriptions.some((keyword) =>
      description.toLowerCase().includes(keyword)
    );

    if (!isAllowed) {
      return NextResponse.json(
        {
          error:
            'Invalid invoice description. Only admin/platform/compliance fees allowed.',
        },
        { status: 400 }
      );
    }

    const Stripe = (await import('stripe')).default;
    const stripe = getStripe();

    // Create invoice item
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      description,
    });

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true,
    });

    // Save to database
    const supabase = await getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
    const { data, error }: any = await supabase
      .from('invoices')
      .insert([
        {
          employer_id,
          amount,
          description,
          status: 'pending',
          stripe_invoice_id: invoice.id,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save invoice' },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoice: data, stripeInvoice: invoice });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function _GET(request: Request) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await getAdminClient();

    const { data, error }: any = await supabase
      .from('invoices')
      .select('*');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoices: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withRuntime(withApiAudit('/api/stripe/invoice/create', _GET));
export const POST = withRuntime(withApiAudit('/api/stripe/invoice/create', _POST));
