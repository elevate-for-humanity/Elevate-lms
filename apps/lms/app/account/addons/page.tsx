import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getOrganizationFeatures } from '@/lib/platform/organization-features';
import { AccountBillingShell, UpgradeCta } from '@/components/billing/AccountBillingShell';
import { getAccountOrganizationId } from '@/lib/account/organization-context';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Add-ons | Account',
  robots: { index: false, follow: false },
};

export default async function AccountAddonsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/account/addons');

  const orgId = await getAccountOrganizationId();
  const admin = await requireAdminClient();

  const { data: catalog } = admin
    ? await admin.from('saas_addon_catalog').select('*').eq('active', true).order('sort_order')
    : { data: null };

  const entitlements = orgId && admin ? await getOrganizationFeatures(orgId, admin) : null;

  return (
    <AccountBillingShell title="Add-ons">
      {entitlements?.activeAddonCodes.length ? (
        <div className="mb-6 bg-brand-green-50 border border-brand-green-200 rounded-xl p-4">
          <p className="font-semibold text-slate-900 mb-2">Active on your organization</p>
          <ul className="text-sm text-slate-700 space-y-1">
            {entitlements.activeAddonCodes.map((c) => (
              <li key={c} className="font-mono">
                {c}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-slate-600 mb-4">No paid add-ons active yet.</p>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {(catalog ?? []).map((a) => {
          const active = entitlements?.activeAddonCodes.includes(a.code);
          return (
            <div
              key={a.code}
              className={`rounded-xl border p-4 ${active ? 'border-brand-blue-400 bg-brand-blue-50' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex justify-between">
                <span className="font-bold text-slate-900">{a.name}</span>
                <span className="font-bold text-brand-blue-600">${a.monthly_price}/mo</span>
              </div>
              {active && <span className="text-xs text-brand-green-700 font-semibold">Active</span>}
            </div>
          );
        })}
      </div>

      <Link href="/store/plans#addons" className="text-brand-blue-600 font-semibold hover:underline">
        Add modules from the store →
      </Link>
      {!orgId && <UpgradeCta />}
    </AccountBillingShell>
  );
}
