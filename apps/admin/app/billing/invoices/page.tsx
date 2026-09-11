import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { CreateQuickBooksInvoice } from './CreateQuickBooksInvoice';

export const dynamic = 'force-dynamic';
const money = (value: unknown) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

export default async function AdminBillingInvoicesPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();
  const [{ data: current, error: currentError }, { data: history, error: historyError }] =
    await Promise.all([
      db
        .from('billing_invoices')
        .select(
          'id,provider,invoice_number,customer_external_key,total_cents,status,due_at,paid_at,payment_url,created_at',
        )
        .order('created_at', { ascending: false })
        .limit(250),
      db
        .from('invoices')
        .select(
          'id,user_id,invoice_number,amount,total,currency,status,due_date,paid_at,created_at',
        )
        .order('created_at', { ascending: false })
        .limit(250),
    ]);
  const invoices = [
    ...(current || []).map((row: any) => ({
      ...row,
      user_id: row.customer_external_key,
      total: Number(row.total_cents) / 100,
      due_date: row.due_at,
    })),
    ...(history || []).map((row: any) => ({
      ...row,
      provider: 'stripe history',
      payment_url: null,
    })),
  ].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const open = invoices.filter((row) =>
    ['pending', 'open', 'unpaid', 'overdue', 'past_due'].includes(String(row.status).toLowerCase()),
  );
  const outstanding = open.reduce((sum, row) => sum + Number(row.total ?? row.amount ?? 0), 0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">All invoices</h1>
          <p className="text-sm text-slate-600">
            QuickBooks activity and preserved Stripe history in one ledger.
          </p>
        </div>
        <CreateQuickBooksInvoice />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs text-slate-500">Outstanding</p>
          <p className="text-2xl font-bold">{money(outstanding)}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs text-slate-500">Open invoices</p>
          <p className="text-2xl font-bold">{open.length}</p>
        </div>
      </div>
      {currentError || historyError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          Some invoice history could not be loaded.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((row) => (
              <tr key={`${row.provider}:${row.id}`}>
                <td className="px-4 py-3">
                  {row.payment_url ? (
                    <a
                      className="underline"
                      href={row.payment_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {row.invoice_number || row.id.slice(0, 8)}
                    </a>
                  ) : (
                    row.invoice_number || row.id.slice(0, 8)
                  )}
                </td>
                <td className="px-4 py-3 capitalize">{row.provider}</td>
                <td className="px-4 py-3 text-xs">{row.user_id || 'Unassigned'}</td>
                <td className="px-4 py-3 capitalize">{row.status}</td>
                <td className="px-4 py-3 text-right font-bold">{money(row.total ?? row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        New invoices are created in QuickBooks. Stripe is archive-only.{' '}
        <Link href="/settings/payments" className="underline">
          Payment settings
        </Link>
      </p>
    </div>
  );
}
