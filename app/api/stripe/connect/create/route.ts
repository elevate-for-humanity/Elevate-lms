

import { z } from 'zod';
import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const connectCreateSchema = z.object({
  employer_id: z.string().uuid(),
});

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const auth = await apiRequireAdmin();
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const parsed = connectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      );
    }
    const { employer_id } = parsed.data;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Dynamic import to avoid build errors if Stripe not installed
    const Stripe = (await import('stripe')).default;
    const stripe = getStripe();

    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: { transfers: { requested: true } },
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
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withRuntime(withApiAudit('/api/stripe/connect/create', _POST));
