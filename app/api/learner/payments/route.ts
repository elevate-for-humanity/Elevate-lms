import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  const userId = auth.id;

  const supabase = await createClient();

  // Fetch from payment_logs (Stripe-linked payments)
  const { data: paymentLogs } = await supabase
    .from('payment_logs')
    .select(
      'id, amount, currency, status, payment_option, stripe_payment_intent_id, stripe_session_id, completed_at, created_at, metadata',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch from program_enrollments (enrollment payments)
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(
      'id, amount_paid_cents, funding_source, stripe_payment_intent_id, stripe_session_id, status, enrolled_at, programs ( id, title )',
    )
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false })
    .limit(50);

  // Normalise into a unified list
  const logs = (paymentLogs ?? []).map((p) => ({
    id: p.id,
    source: 'payment_log' as const,
    amount: p.amount ?? 0, // cents
    currency: p.currency ?? 'usd',
    status: p.status ?? 'unknown',
    description: (p.metadata as Record<string, string> | null)?.description ?? 'Payment',
    payment_method: p.payment_option ?? null,
    stripe_payment_intent_id: p.stripe_payment_intent_id ?? null,
    date: p.completed_at ?? p.created_at,
  }));

  const enrollmentPayments = (enrollments ?? [])
    .filter((e) => (e.amount_paid_cents ?? 0) > 0)
    .map((e) => {
      const prog = e.programs as { id: string; title: string } | null;
      return {
        id: e.id,
        source: 'enrollment' as const,
        amount: e.amount_paid_cents ?? 0,
        currency: 'usd',
        status: e.status === 'active' || e.status === 'enrolled' ? 'completed' : e.status,
        description: prog?.title ? `Enrollment — ${prog.title}` : 'Program Enrollment',
        payment_method: e.funding_source ?? null,
        stripe_payment_intent_id: e.stripe_payment_intent_id ?? null,
        date: e.enrolled_at,
      };
    });

  // Merge and sort by date descending, deduplicate by stripe_payment_intent_id
  const seen = new Set<string>();
  const all = [...logs, ...enrollmentPayments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((p) => {
      if (p.stripe_payment_intent_id) {
        if (seen.has(p.stripe_payment_intent_id)) return false;
        seen.add(p.stripe_payment_intent_id);
      }
      return true;
    });

  const totalPaid = all
    .filter((p) => p.status === 'completed' || p.status === 'succeeded' || p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return NextResponse.json({ payments: all, totalPaidCents: totalPaid });
}
