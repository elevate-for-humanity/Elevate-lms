import type { Metadata } from 'next';
import { AlertTriangle, CheckCircle2, CreditCard, DollarSign, ShieldCheck, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Stripe Integration | Admin | Elevate For Humanity' };

type PaymentRow = {
  id: string;
  name: string | null;
  email: string | null;
  amountCents: number;
  reference: string | null;
  status: string | null;
  paidAt: string | null;
  source: string;
};

type FlagRow = {
  id: string;
  flag_type: string;
  flag_reason: string | null;
  entity_type: string | null;
  entity_id: string | null;
  flagged_at: string | null;
  resolved_at: string | null;
  resolution: string | null;
};

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
function dollarsToCents(value: unknown) {
  return Math.round(number(value) * 100);
}
function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value / 100);
}
function date(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

export default async function AdminStripeIntegrationPage() {
  await requireAdmin();
  const db = await requireAdminClient();

  const [flagsResult, enrollmentResult, stagingResult, barberResult, cosmetologyResult, barberPaymentsResult] = await Promise.all([
    db.from('payment_integrity_flags').select('id,flag_type,flag_reason,entity_type,entity_id,flagged_at,resolved_at,resolution').order('flagged_at', { ascending: false }).limit(200),
    db.from('program_enrollments').select('id,full_name,email,amount_paid_cents,your_revenue_cents,stripe_payment_intent_id,stripe_checkout_session_id,payment_status,status,enrollment_state,paid_at,enrolled_at,created_at').or('amount_paid_cents.gt.0,your_revenue_cents.gt.0,stripe_payment_intent_id.not.is.null,stripe_checkout_session_id.not.is.null').order('created_at', { ascending: false }).limit(100),
    db.from('stripe_sessions_staging').select('session_id,payment_intent,email,amount,payment_status,created_at').in('payment_status', ['paid', 'completed']).order('created_at', { ascending: false }).limit(100),
    db.from('barber_subscriptions').select('id,customer_name,customer_email,amount_paid_at_checkout,payment_status,status,stripe_checkout_session_id,created_at').gt('amount_paid_at_checkout', 0).order('created_at', { ascending: false }).limit(100),
    db.from('cosmetology_subscriptions').select('id,customer_name,customer_email,amount_paid_at_checkout,payment_status,status,stripe_checkout_session_id,created_at').gt('amount_paid_at_checkout', 0).order('created_at', { ascending: false }).limit(100),
    db.from('barber_payments').select('id,amount_paid,status,stripe_invoice_id,payment_date,created_at').gt('amount_paid', 0).order('payment_date', { ascending: false }).limit(100),
  ]);

  const flags = (flagsResult.data ?? []) as unknown as FlagRow[];
  const payments: PaymentRow[] = [
    ...(enrollmentResult.data ?? []).map((row: any) => ({
      id: row.id,
      name: row.full_name ?? null,
      email: row.email ?? null,
      amountCents: Math.max(number(row.amount_paid_cents), number(row.your_revenue_cents)),
      reference: row.stripe_payment_intent_id ?? row.stripe_checkout_session_id ?? null,
      status: row.payment_status ?? row.status ?? row.enrollment_state ?? null,
      paidAt: row.paid_at ?? row.enrolled_at ?? row.created_at ?? null,
      source: 'Enrollment',
    })),
    ...(stagingResult.data ?? []).map((row: any) => ({
      id: row.session_id,
      name: null,
      email: row.email ?? null,
      amountCents: number(row.amount),
      reference: row.payment_intent ?? row.session_id,
      status: row.payment_status ?? null,
      paidAt: row.created_at ?? null,
      source: 'Stripe session',
    })),
    ...(barberResult.data ?? []).map((row: any) => ({
      id: row.id,
      name: row.customer_name ?? null,
      email: row.customer_email ?? null,
      amountCents: dollarsToCents(row.amount_paid_at_checkout),
      reference: row.stripe_checkout_session_id ?? null,
      status: row.payment_status ?? row.status ?? null,
      paidAt: row.created_at ?? null,
      source: 'Barber checkout',
    })),
    ...(cosmetologyResult.data ?? []).map((row: any) => ({
      id: row.id,
      name: row.customer_name ?? null,
      email: row.customer_email ?? null,
      amountCents: dollarsToCents(row.amount_paid_at_checkout),
      reference: row.stripe_checkout_session_id ?? null,
      status: row.payment_status ?? row.status ?? null,
      paidAt: row.created_at ?? null,
      source: 'Cosmetology checkout',
    })),
    ...(barberPaymentsResult.data ?? []).map((row: any) => ({
      id: row.id,
      name: null,
      email: null,
      amountCents: dollarsToCents(row.amount_paid),
      reference: row.stripe_invoice_id ?? null,
      status: row.status ?? null,
      paidAt: row.payment_date ?? row.created_at ?? null,
      source: 'Barber invoice',
    })),
  ].filter((row) => row.amountCents > 0).sort((a, b) => new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime());

  const unresolvedFlags = flags.filter((flag) => !flag.resolved_at);
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const webhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Integrations', href: '/integrations' }, { label: 'Stripe' }]} />
      <section className="rounded-3xl bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-700 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center gap-4"><CreditCard className="h-10 w-10" /><div><h1 className="text-3xl font-black">Stripe Integration</h1><p className="text-sm text-violet-100">Live payment evidence and integrity review.</p></div><div className="ml-auto flex flex-wrap gap-2"><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">{stripeConfigured ? 'API keys configured' : 'API keys missing'}</span><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">{webhookConfigured ? 'Webhook configured' : 'Webhook missing'}</span></div></div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><DollarSign className="h-5 w-5 text-emerald-700" /><p className="mt-3 text-2xl font-black text-slate-950">{money(totalRevenue)}</p><p className="text-xs font-bold text-slate-500">Recorded payment value</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Users className="h-5 w-5 text-brand-blue-700" /><p className="mt-3 text-2xl font-black text-slate-950">{payments.length}</p><p className="text-xs font-bold text-slate-500">Payment records</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><AlertTriangle className="h-5 w-5 text-rose-700" /><p className="mt-3 text-2xl font-black text-slate-950">{unresolvedFlags.length}</p><p className="text-xs font-bold text-slate-500">Open integrity flags</p></div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><ShieldCheck className="h-4 w-4" /><h2 className="font-black text-slate-950">Payment integrity flags</h2></div>
        {unresolvedFlags.length === 0 ? <div className="flex items-center gap-2 p-6 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-5 w-5" />No unresolved payment integrity flags.</div> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50"><tr>{['Type','Reason','Entity','Flagged'].map((label) => <th key={label} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{unresolvedFlags.map((flag) => <tr key={flag.id}><td className="px-4 py-3 font-bold text-rose-700">{flag.flag_type.replaceAll('_',' ')}</td><td className="px-4 py-3 text-slate-700">{flag.flag_reason || '—'}</td><td className="px-4 py-3 font-mono text-xs text-slate-600">{flag.entity_type || '—'} {flag.entity_id ? flag.entity_id.slice(0, 12) : ''}</td><td className="px-4 py-3 text-slate-600">{date(flag.flagged_at)}</td></tr>)}</tbody></table></div>}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-950">Recent payments</h2></div>
        {payments.length === 0 ? <p className="p-6 text-sm text-slate-600">No payment records found.</p> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50"><tr>{['Name / Email','Amount','Status','Source','Reference','Paid'].map((label) => <th key={label} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{payments.slice(0,100).map((payment) => <tr key={`${payment.source}-${payment.id}`}><td className="px-4 py-3"><p className="font-bold text-slate-900">{payment.name || '—'}</p><p className="text-xs text-slate-500">{payment.email || '—'}</p></td><td className="px-4 py-3 font-bold text-slate-900">{money(payment.amountCents)}</td><td className="px-4 py-3 text-slate-700">{payment.status || '—'}</td><td className="px-4 py-3 text-slate-700">{payment.source}</td><td className="px-4 py-3 font-mono text-xs text-slate-500">{payment.reference ? `${payment.reference.slice(0,18)}…` : '—'}</td><td className="px-4 py-3 text-slate-600">{date(payment.paidAt)}</td></tr>)}</tbody></table></div>}
      </section>
    </main>
  );
}
