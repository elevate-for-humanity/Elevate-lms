import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const money = (cents: unknown, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
    Number(cents || 0) / 100,
  );

export default async function ProviderPayablesPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();
  const { data: rows, error } = await db
    .from('provider_payables')
    .select(
      'id,source_type,source_order_id,provider_id,gross_amount_cents,platform_fee_cents,payable_amount_cents,currency,status,payout_reference,created_at',
    )
    .order('created_at', { ascending: false })
    .limit(500);
  const open = (rows || []).filter((row) => ['pending', 'approved', 'held'].includes(row.status));
  const total = open.reduce((sum, row) => sum + Number(row.payable_amount_cents), 0);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Provider payables</h1>
        <p className="text-sm text-slate-600">
          Amounts Elevate owes marketplace providers after collecting customer payments as merchant
          of record.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs text-slate-500">Open liability</p>
          <p className="mt-1 text-2xl font-bold">{money(total, 'usd')}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs text-slate-500">Awaiting settlement</p>
          <p className="mt-1 text-2xl font-bold">{open.length}</p>
        </div>
      </div>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          Payables could not be loaded.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Customer paid</th>
              <th className="px-4 py-3 text-right">Elevate fee</th>
              <th className="px-4 py-3 text-right">Provider owed</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(rows || []).map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <span className="capitalize">{row.source_type.replace('_', ' ')}</span>
                  <br />
                  <span className="font-mono text-xs text-slate-500">{row.source_order_id}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{row.provider_id}</td>
                <td className="px-4 py-3 capitalize">{row.status}</td>
                <td className="px-4 py-3 text-right">
                  {money(row.gross_amount_cents, row.currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  {money(row.platform_fee_cents, row.currency)}
                </td>
                <td className="px-4 py-3 text-right font-bold">
                  {money(row.payable_amount_cents, row.currency)}
                </td>
              </tr>
            ))}
            {!rows?.length ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No provider liabilities recorded.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Checkout never sends automatic payouts. A payable must be reviewed and separately marked
        paid with an external payout reference.
      </p>
    </div>
  );
}
