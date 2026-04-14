import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payments & Billing | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/payments');

  // Fetch payment records for this learner
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, status, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const fmt = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const statusIcon = (status: string) => {
    if (status === 'succeeded' || status === 'paid') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'pending') return <Clock className="w-4 h-4 text-amber-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <CreditCard className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-bold text-slate-900">Payments &amp; Billing</h1>
      </div>

      {!payments?.length ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No payment records yet.</p>
          <p className="text-sm text-slate-400 mt-1">
            Payments will appear here after your first transaction.
          </p>
          <Link
            href="/lms/courses"
            className="inline-block mt-6 px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition-colors"
          >
            View My Courses
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-6 py-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {statusIcon(p.status)}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {p.description || 'Payment'}
                  </p>
                  <p className="text-xs text-slate-400">{fmtDate(p.created_at)}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-slate-900">{fmt(p.amount ?? 0)}</p>
                <p className="text-xs capitalize text-slate-400">{p.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400 text-center">
        Questions about a charge?{' '}
        <a href="tel:3173143757" className="text-brand-blue-600 hover:underline">
          Call (317) 314-3757
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
