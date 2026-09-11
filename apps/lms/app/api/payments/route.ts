import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { retiredStripeCheckout } from '@/lib/billing/retired-stripe-checkout';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function readHistory(request: NextRequest) {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  if (!auth.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = Math.min(
    Math.max(Number(new URL(request.url).searchParams.get('limit')) || 50, 1),
    100,
  );
  const db = await createClient();
  const { data, error } = await db
    .from('payments')
    .select('id,amount,amount_cents,currency,status,description,provider,created_at')
    .eq('user_id', auth.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error)
    return NextResponse.json({ error: 'Payment history is unavailable.' }, { status: 500 });
  return NextResponse.json({ payments: data ?? [] });
}

async function retireMutations() {
  return retiredStripeCheckout({
    destination: '/lms/documents',
    reason: 'Stripe payment, saved-card, refund, and subscription mutations are retired.',
  });
}

export const GET = withRuntime(withApiAudit('/api/payments', readHistory));
export const POST = withRuntime(withApiAudit('/api/payments', retireMutations));
