
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard } from '@/lib/authGuards';

export async function POST(req: Request) {
  try {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });

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
    const supabase = createAdminClient();
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
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = createAdminClient();

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
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
