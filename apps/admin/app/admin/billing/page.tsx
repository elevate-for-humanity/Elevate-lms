import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminBillingOverviewPage() {
  const admin = await requireAdminClient();
  const supabase = await createClient();

  if (!admin) {
    return (
      <p className="text-slate-600 text-sm">Admin database client unavailable. Check service role env.</p>
    );
  }

  const [{ count: planCount }, { count: subCount }, { count: addonCount }] = await Promise.all([
    admin.from('subscription_plans').select('id', { count: 'exact', head: true }),
    admin.from('organization_subscriptions').select('id', { count: 'exact', head: true }),
    admin.from('addon_subscriptions').select('id', { count: 'exact', head: true }).eq('active', true),
  ]);

  const { count: licenseCount } = await supabase
    .from('licenses')
    .select('id', { count: 'exact', head: true });

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Active plans', value: planCount ?? 0, href: '/admin/billing/plans' },
        { label: 'Org subscriptions', value: subCount ?? 0, href: '/admin/billing/subscriptions' },
        { label: 'Active add-ons', value: addonCount ?? 0, href: '/admin/billing/addons' },
        { label: 'Licenses (legacy sync)', value: licenseCount ?? 0, href: '/admin/billing/licenses' },
      ].map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition"
        >
          <div className="text-3xl font-bold text-slate-900">{card.value}</div>
          <div className="text-sm text-slate-600 mt-1">{card.label}</div>
        </Link>
      ))}
    </div>
  );
}
