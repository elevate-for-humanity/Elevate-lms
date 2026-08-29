import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CreditCard, CheckCircle, Clock, AlertCircle, DollarSign, ArrowRight, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = { title: 'Payments & Billing' };
export const dynamic = 'force-dynamic';

const fmt = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

function programTitle(value: unknown): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === 'object' && 'title' in row ? String((row as { title?: unknown }).title || '') || null : null;
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (['completed', 'succeeded', 'paid', 'active', 'enrolled'].includes(s)) return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"><CheckCircle className="h-3 w-3" /> Paid</span>;
  if (s === 'pending' || s === 'checkout_started') return <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700"><Clock className="h-3 w-3" /> Pending</span>;
  if (s === 'refunded') return <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700"><ArrowRight className="h-3 w-3" /> Refunded</span>;
  return <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700"><AlertCircle className="h-3 w-3" /> {status || 'Unknown'}</span>;
}

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/payments');

  const [{ data: paymentLogs }, { data: enrollments }, { data: invoices }] = await Promise.all([
    supabase.from('payment_logs').select('id, amount, currency, status, payment_option, stripe_payment_intent_id, completed_at, created_at, metadata').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('program_enrollments').select('id, amount_paid_cents, funding_source, stripe_payment_intent_id, status, enrolled_at, programs ( id, title )').eq('user_id', user.id).order('enrolled_at', { ascending: false }).limit(50),
    supabase.from('invoices').select('id, invoice_number, amount, total, status, due_date, paid_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
  ]);

  const openInvoices = (invoices ?? []).filter((invoice: any) =>
    ['pending', 'open', 'unpaid', 'overdue', 'past_due'].includes(String(invoice.status).toLowerCase()),
  );
  const nextInvoice = [...openInvoices].sort((a: any, b: any) =>
    new Date(a.due_date || a.created_at).getTime() - new Date(b.due_date || b.created_at).getTime(),
  )[0] as any;
  const amountDue = openInvoices.reduce(
    (sum: number, invoice: any) => sum + Number(invoice.total ?? invoice.amount ?? 0),
    0,
  );

  const logs = (paymentLogs ?? []).map((row: any) => ({
    id: row.id,
    amount: row.amount ?? 0,
    status: row.status ?? 'unknown',
    description: (row.metadata as Record<string, string> | null)?.description ?? 'Payment',
    method: row.payment_option ?? null,
    stripe_pi: row.stripe_payment_intent_id ?? null,
    date: row.completed_at ?? row.created_at,
  }));

  const enrollmentPayments = (enrollments ?? [])
    .filter((row: any) => (row.amount_paid_cents ?? 0) > 0)
    .map((row: any) => {
      const title = programTitle(row.programs);
      return {
        id: row.id,
        amount: row.amount_paid_cents ?? 0,
        status: row.status === 'active' || row.status === 'enrolled' ? 'completed' : (row.status ?? 'unknown'),
        description: title ? `Enrollment — ${title}` : 'Program Enrollment',
        method: row.funding_source ?? null,
        stripe_pi: row.stripe_payment_intent_id ?? null,
        date: row.enrolled_at,
      };
    });

  const seen = new Set<string>();
  const payments = [...logs, ...enrollmentPayments]
    .filter((payment) => Boolean(payment.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((payment) => {
      if (!payment.stripe_pi) return true;
      if (seen.has(payment.stripe_pi)) return false;
      seen.add(payment.stripe_pi);
      return true;
    });

  const totalPaid = payments.filter((payment) => ['completed', 'succeeded', 'paid', 'active', 'enrolled'].includes(payment.status?.toLowerCase())).reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><CreditCard className="h-6 w-6 text-slate-700" /><h1 className="text-2xl font-bold text-slate-950">Payments & Billing</h1></div><Link href="/lms/settings/billing" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">Update card <ExternalLink className="h-4 w-4" /></Link></div>
      {openInvoices.length ? <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-amber-800">Payment due</p><p className="mt-1 text-2xl font-bold text-slate-950">${amountDue.toFixed(2)}</p><p className="mt-1 text-sm text-slate-700">{nextInvoice?.due_date ? `Next due ${fmtDate(nextInvoice.due_date)}` : 'Open invoice — payment required'}</p></div><Link href="/lms/settings/billing" className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800">Pay now or update card</Link></div><p className="mt-3 text-xs text-amber-900">Past-due accounts may be placed on a temporary course-access hold. Your completed work and records are preserved.</p></div> : null}
      {payments.length ? <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3"><div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Total Paid</p><p className="text-xl font-bold">{fmt(totalPaid)}</p></div><div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Transactions</p><p className="text-xl font-bold">{payments.length}</p></div><div className="col-span-2 rounded-xl border bg-white p-4 sm:col-span-1"><p className="text-xs text-slate-500">Last Payment</p><p className="text-xl font-bold">{payments[0] ? fmtDate(payments[0].date) : '—'}</p></div></div> : null}
      {!payments.length ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center"><DollarSign className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-600">No payment records yet.</p><Link href="/lms/courses" className="mt-6 inline-block rounded-lg bg-brand-blue-600 px-5 py-2.5 text-sm font-semibold text-white">View My Programs</Link></div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {payments.map((payment) => <div key={payment.id} className="flex items-center justify-between gap-4 px-6 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{payment.description}</p><p className="text-xs text-slate-500">{fmtDate(payment.date)}{payment.method ? ` · ${String(payment.method).replace(/_/g, ' ')}` : ''}</p></div><div className="flex items-center gap-3"><StatusBadge status={payment.status} /><p className="w-20 text-right text-sm font-bold">{fmt(payment.amount)}</p></div></div>)}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-slate-500">Questions about a charge? <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`} className="text-brand-blue-600">Call {PLATFORM_DEFAULTS.supportPhone}</a>.</p>
    </main>
  );
}
