import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import {
  Scissors, Sparkles, Flower2, Hand,
  CheckCircle2, AlertCircle, Clock, XCircle,
  DollarSign, Plus, ExternalLink,
} from 'lucide-react';
import { BOOTH_RENTAL_TIERS, type BoothRentalDiscipline } from '@/lib/programs/pricing';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Booth Renters | Staff Portal',
};

const DISCIPLINE_ICONS: Record<string, React.ReactNode> = {
  barber:        <Scissors className="w-4 h-4" />,
  cosmetologist: <Sparkles className="w-4 h-4" />,
  esthetician:   <Flower2 className="w-4 h-4" />,
  nail_tech:     <Hand className="w-4 h-4" />,
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  active:    { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Active' },
  past_due:  { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: <AlertCircle className="w-3.5 h-3.5" />,  label: 'Past Due' },
  suspended: { bg: 'bg-red-50',     text: 'text-red-700',     icon: <XCircle className="w-3.5 h-3.5" />,      label: 'Suspended' },
  pending:   { bg: 'bg-slate-50',   text: 'text-slate-600',   icon: <Clock className="w-3.5 h-3.5" />,        label: 'Pending' },
};

export default async function BoothRentersPage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  const _admin = createAdminClient();
  const supabase = await createClient();
  const db = _admin || supabase;

  // Fetch all booth rental subscriptions
  const { data: renters } = await db
    .from('booth_rental_subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  const allRenters = renters ?? [];

  // Summary counts
  const active    = allRenters.filter(r => r.payment_status === 'active').length;
  const pastDue   = allRenters.filter(r => r.payment_status === 'past_due').length;
  const suspended = allRenters.filter(r => r.payment_status === 'suspended').length;

  // Weekly revenue from active renters
  const weeklyRevenue = allRenters
    .filter(r => r.payment_status === 'active')
    .reduce((sum: number, r: any) => {
      const tier = BOOTH_RENTAL_TIERS[r.discipline as BoothRentalDiscipline];
      return sum + (tier?.weeklyRateDollars ?? 0);
    }, 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Booth Renters</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage booth and suite rentals across all disciplines</p>
          </div>
          <Link
            href="/booth-rental/apply"
            className="flex items-center gap-2 bg-brand-blue-700 hover:bg-brand-blue-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Renter
          </Link>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active Renters', value: active, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Past Due', value: pastDue, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Suspended', value: suspended, color: 'text-red-700', bg: 'bg-red-50' },
            { label: 'Weekly Revenue', value: `$${weeklyRevenue}`, color: 'text-brand-blue-700', bg: 'bg-brand-blue-50' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Renter table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">All Renters</h2>
            <span className="text-xs text-slate-400">{allRenters.length} total</span>
          </div>

          {allRenters.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <DollarSign className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No booth renters yet</p>
              <p className="text-sm mt-1">
                <Link href="/booth-rental/apply" className="text-brand-blue-600 hover:underline">Add the first renter →</Link>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Renter</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Discipline</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Weekly Rate</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">MOU</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Since</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allRenters.map((renter: any) => {
                    const tier = BOOTH_RENTAL_TIERS[renter.discipline as BoothRentalDiscipline];
                    const status = STATUS_STYLES[renter.payment_status] ?? STATUS_STYLES.pending;
                    const since = renter.created_at
                      ? new Date(renter.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—';

                    return (
                      <tr key={renter.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{renter.renter_name}</p>
                          <p className="text-xs text-slate-400">{renter.renter_email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            {DISCIPLINE_ICONS[renter.discipline] ?? <Scissors className="w-4 h-4" />}
                            <span className="capitalize">{tier?.label ?? renter.discipline}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{tier?.spaceType ?? 'Booth'}</p>
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          ${tier?.weeklyRateDollars ?? '—'}/wk
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                            {status.icon} {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {renter.mou_signed ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Signed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold">
                              <AlertCircle className="w-3.5 h-3.5" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-400">{since}</td>
                        <td className="px-4 py-4">
                          {renter.stripe_customer_id && (
                            <a
                              href={`https://dashboard.stripe.com/customers/${renter.stripe_customer_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-brand-blue-600 hover:underline"
                            >
                              Stripe <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.values(BOOTH_RENTAL_TIERS).map(tier => (
            <Link
              key={tier.discipline}
              href={`/booth-rental/apply?discipline=${tier.discipline}`}
              className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-400 hover:shadow-sm transition-all text-sm text-slate-700"
            >
              {DISCIPLINE_ICONS[tier.discipline]}
              <span>Add {tier.label}</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
