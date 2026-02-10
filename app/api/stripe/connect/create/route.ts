
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/authGuards';

export async function POST(req: Request) {
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const body = await req.json();
    const { employer_id } = body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Dynamic import to avoid build errors if Stripe not installed
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });

    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: { transfers: { requested: true } },
    });

    // Save to database
    const supabase = createAdminClient();
    const { data, error }: any = await supabase
      .from('billing_accounts')
      .insert([
        {
          employer_id,
          stripe_account_id: account.id,
          onboarding_completed: false,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ accountId: account.id });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
