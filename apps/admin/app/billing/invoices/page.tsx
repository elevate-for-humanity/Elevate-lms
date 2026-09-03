import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const money = (value: unknown) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

export default async function AdminBillingInvoicesPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('invoices')
    .select('id, user_id, invoice_number, amount, total, currency, status, due_date, paid_at, created_at')
    .order('created_at', { ascending: false })
    .limit(250);
  const invoices = data ?? [];
  const open = invoices.filter((invoice) => ['pending', 'open', 'unpaid', 'overdue', 'past_due'].includes(String(invoice.status).toLowerCase()));
  const pastDue = invoices.filter((invoice) => ['overdue', 'past_due', 'failed'].includes(String(invoice.status).toLowerCase()));
  const outstanding = open.reduce((sum, invoice) => sum + Number(invoice.total ?? invoice.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-950">Student invoices</h1><p className="text-sm text-slate-600">Live invoice records used by student billing dashboards.</p></div>
        <a href="https://dashboard.stripe.com/invoices/create" target="_blank" rel="noreferrer" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">Create invoice in Stripe</a>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5"><p className="text-xs text-slate-500">Outstanding</p><p className="mt-1 text-2xl font-bold">{money(outstanding)}</p></div>
        <div className="rounded-xl border bg-white p-5"><p className="text-xs text-slate-500">Open invoices</p><p className="mt-1 text-2xl font-bold">{open.length}</p></div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5"><p className="text-xs text-red-700">Past due / failed</p><p className="mt-1 text-2xl font-bold text-red-900">{pastDue.length}</p></div>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Invoice data could not be loaded: {error.message}</div> : null}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Student ID</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Amount</th></tr></thead><tbody className="divide-y divide-slate-100">{invoices.map((invoice) => <tr key={invoice.id}><td className="px-4 py-3 font-medium text-slate-900">{invoice.invoice_number || invoice.id.slice(0, 8)}</td><td className="px-4 py-3 font-mono text-xs text-slate-500">{invoice.user_id || 'Unassigned'}</td><td className="px-4 py-3 text-slate-600">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not set'}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize">{invoice.status || 'pending'}</span></td><td className="px-4 py-3 text-right font-bold">{money(invoice.total ?? invoice.amount)}</td></tr>)}{!invoices.length ? <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No invoice records found.</td></tr> : null}</tbody></table></div></div>
      <p className="text-xs text-slate-500">Create and send invoices in Stripe; signed webhooks synchronize payment status and enforcement. <Link href="/settings/payments" className="font-semibold text-brand-blue-700 underline">Payment settings</Link></p>
    </div>
  );
}
