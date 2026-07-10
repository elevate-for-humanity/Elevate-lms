import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CreditCard, CheckCircle, Clock, AlertCircle, DollarSign, ArrowRight } from 'lucide-react';
import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Payments & Billing',
};

export const dynamic = 'force-dynamic';

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === 'completed' || s === 'succeeded' || s === 'paid' || s === 'active' || s === 'enrolled') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
        <CheckCircle className="w-3 h-3" /> Paid
      </span>
    );
  }
  if (s === 'pending' || s === 'checkout_started') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  }
  if (s === 'refunded') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">
        <ArrowRight className="w-3 h-3" /> Refunded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
      <AlertCircle className="w-3 h-3" /> {status ?? 'Unknown'}
    </span>
  );
}

export default async function PaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/payments');

  // Fetch payment_logs (Stripe-linked payments)
  const { data: paymentLogs } = await supabase
    .from('payment_logs')
    .select(
      'id, amount, currency, status, payment_option, stripe_payment_intent_id, completed_at, created_at, metadata',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch program_enrollments with payment amounts
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(
      'id, amount_paid_cents, funding_source, stripe_payment_intent_id, status, enrolled_at, programs ( id, title )',
    )
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })
    .limit(50);

  // Normalise payment_logs
  const logs = (paymentLogs ?? []).map((p) => ({
    id: p.id,
    amount: p.amount ?? 0,
    status: p.status ?? 'unknown',
    description: (p.metadata as Record<string, string> | null)?.description ?? 'Payment',
    method: p.payment_option ?? null,
    stripe_pi: p.stripe_payment_intent_id ?? null,
    date: p.completed_at ?? p.created_at,
  }));

  // Normalise enrollment payments (only those with an amount)
  const enrollmentPayments = (enrollments ?? [])
    .filter((e) => (e.amount_paid_cents ?? 0) > 0)
    .map((e) => {
      const prog = e.programs as { id: string; title: string } | null;
      return {
        id: e.id,
        amount: e.amount_paid_cents ?? 0,
        status:
          e.status === 'active' || e.status === 'enrolled'
            ? 'completed'
            : (e.status ?? 'unknown'),
        description: prog?.title ? `Enrollment — ${prog.title}` : 'Program Enrollment',
        method: e.funding_source ?? null,
        stripe_pi: e.stripe_payment_intent_id ?? null,
        date: e.enrolled_at,
      };
    });

  // Merge, deduplicate by stripe_payment_intent_id, sort by date desc
  const seen = new Set<string>();
  const payments = [...logs, ...enrollmentPayments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((p) => {
      if (p.stripe_pi) {
        if (seen.has(p.stripe_pi)) return false;
        seen.add(p.stripe_pi);
      }
      return true;
    });

  const totalPaid = payments
    .filter((p) => {
      const s = p.status?.toLowerCase();
      return s === 'completed' || s === 'succeeded' || s === 'paid' || s === 'active' || s === 'enrolled';
    })
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <CreditCard className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-bold text-slate-900">Payments &amp; Billing</h1>
      </div>

      {/* Summary strip */}
      {payments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Total Paid</p>
            <p className="text-xl font-bold text-slate-900">{fmt(totalPaid)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Transactions</p>
            <p className="text-xl font-bold text-slate-900">{payments.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2 sm:col-span-1">
            <p className="text-xs text-slate-500 mb-1">Last Payment</p>
            <p className="text-xl font-bold text-slate-900">
              {payments[0] ? fmtDate(payments[0].date) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Payment list */}
      {!payments.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No payment records yet.</p>
          <p className="text-sm text-slate-400 mt-1">
            Payments will appear here after your first transaction.
          </p>
          <Link
            href="/lms/courses"
            className="inline-block mt-6 px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition-colors"
          >
            View My Programs
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-6 py-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{p.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400">{fmtDate(p.date)}</p>
                    {p.method && (
                      <span className="text-xs text-slate-400 capitalize">
                        · {p.method.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={p.status} />
                <p className="text-sm font-bold text-slate-900 tabular-nums w-20 text-right">
                  {fmt(p.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400 text-center">
        Questions about a charge?{' '}
        <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="text-brand-blue-600 hover:underline">
          Call {PLATFORM_DEFAULTS.supportPhone}
        </a>{' '}
        or{' '}
        <a href="mailto:info@elevateforhumanity.org" className="text-brand-blue-600 hover:underline">
          email us
        </a>
        .
      </p>
    </div>
  );
}
