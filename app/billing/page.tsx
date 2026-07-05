import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { CreditCard, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Billing',
  description: 'Manage your billing, payment methods, and invoices.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/billing' },
};

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/billing');

  const db = await requireAdminClient();

  // Pull invoices for this user
  // Columns: id, invoice_number, amount, total, status, due_date, paid_at, created_at, items
  const { data: invoices } = await db
    .from('invoices')
    .select('id, invoice_number, amount, total, status, due_date, paid_at, created_at, items')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const totalOwed =
    invoices
      ?.filter((i) => i.status === 'unpaid' || i.status === 'overdue')
      .reduce((sum, i) => sum + (i.total ?? i.amount ?? 0), 0) ?? 0;

  const totalPaid =
    invoices
      ?.filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + (i.total ?? i.amount ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Account', href: '/account' }, { label: 'Billing' }]} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Billing &amp; Payments</h1>

        {/* Summary cards */}
        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <CreditCard className="w-6 h-6 text-brand-red-500 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900">
              ${Number(totalOwed).toFixed(2)}
            </p>
            <p className="text-sm text-slate-500 mt-1">Balance Due</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <CheckCircle className="w-6 h-6 text-brand-green-500 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900">
              ${Number(totalPaid).toFixed(2)}
            </p>
            <p className="text-sm text-slate-500 mt-1">Total Paid</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <FileText className="w-6 h-6 text-slate-400 mb-3" />
            <p className="text-2xl font-extrabold text-slate-900">{invoices?.length ?? 0}</p>
            <p className="text-sm text-slate-500 mt-1">Total Invoices</p>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Invoices</h2>
            <Link
              href="/account/billing"
              className="text-sm text-brand-red-600 hover:underline flex items-center gap-1"
            >
              Full billing history <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {!invoices || invoices.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500 text-sm">No invoices found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">
                      {inv.invoice_number ? `Invoice #${inv.invoice_number}` : 'Invoice'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {inv.due_date
                        ? `Due ${new Date(inv.due_date).toLocaleDateString()}`
                        : new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        inv.status === 'paid'
                          ? 'bg-brand-green-50 text-brand-green-700'
                          : inv.status === 'overdue'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {inv.status ?? 'pending'}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      ${Number(inv.total ?? inv.amount ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paid invoices */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Payment History</h2>
          </div>
          {!invoices || invoices.filter((i) => i.status === 'paid').length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500 text-sm">
              No payments recorded.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {invoices
                .filter((i) => i.status === 'paid')
                .map((inv) => (
                  <div
                    key={`paid-${inv.id}`}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {inv.invoice_number ? `Invoice #${inv.invoice_number}` : 'Invoice'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {inv.paid_at
                          ? `Paid ${new Date(inv.paid_at).toLocaleDateString()}`
                          : new Date(inv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      ${Number(inv.total ?? inv.amount ?? 0).toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-100 p-4">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500">
            For billing questions or disputes, contact{' '}
            <a href="mailto:billing@elevateforhumanity.org" className="underline">
              billing@elevateforhumanity.org
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
