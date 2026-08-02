// Server component — no client state.
import Link from 'next/link';
import { DollarSign, ArrowRight } from 'lucide-react';
import type { RecentPayment } from './types';

interface Props {
  payments: RecentPayment[];
}

const SOURCE_LABELS: Record<string, string> = {
  stripe:           'Stripe',
  barber:           'Barber',
  cosmetology:      'Cosmetology',
  barber_recurring: 'Barber recurring',
};

function fmtCents(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function slugToLabel(slug: string | null) {
  if (!slug) return null;
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RecentPaymentsPanel({ payments }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900 text-sm">Recent Payments</h2>
        </div>
        <Link
          href="/students?payment_status=paid"
          className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {payments.length === 0 ? (
        <p className="px-6 py-8 text-sm text-slate-400 text-center">No recent payments found.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-slate-50 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {p.email ?? slugToLabel(p.label) ?? 'Unknown payer'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {slugToLabel(p.label) ?? SOURCE_LABELS[p.source] ?? p.source}
                  {' · '}
                  <span className="text-slate-400">{SOURCE_LABELS[p.source] ?? p.source}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4 text-right">
                <span className="text-sm font-bold text-emerald-600 tabular-nums">
                  {fmtCents(p.amountCents)}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">{fmtDate(p.paidAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
