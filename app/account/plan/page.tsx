import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getOrganizationFeatures } from '@/lib/platform/organization-features';
import { AccountBillingShell, UpgradeCta } from '@/components/billing/AccountBillingShell';
import { getAccountOrganizationId } from '@/lib/account/organization-context';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Your plan | Account',
  robots: { index: false, follow: false },
};

export default async function AccountPlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/account/plan');

  const orgId = await getAccountOrganizationId();
  if (!orgId) {
    return (
      <AccountBillingShell title="Your plan">
        <p className="text-slate-600">No organization is linked to your account yet.</p>
        <UpgradeCta />
      </AccountBillingShell>
    );
  }

  const admin = await requireAdminClient();
  const entitlements = admin
    ? await getOrganizationFeatures(orgId, admin)
    : await getOrganizationFeatures(orgId);

  return (
    <AccountBillingShell title="Your plan">
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div>
          <p className="text-sm text-slate-500">Current plan</p>
          <p className="text-xl font-bold text-slate-900">
            {entitlements.planName ?? 'No active subscription'}
          </p>
          {entitlements.status && (
            <p className="text-sm text-slate-600 capitalize">Status: {entitlements.status}</p>
          )}
        </div>
        {entitlements.currentPeriodEnd && (
          <p className="text-sm text-slate-600">
            Renews / period ends:{' '}
            {new Date(entitlements.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}
        <div>
          <p className="text-sm font-semibold text-slate-900 mb-2">Included features</p>
          <ul className="flex flex-wrap gap-2">
            {entitlements.features.map((f) => (
              <li
                key={f}
                className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded"
              >
                {f}
              </li>
            ))}
          </ul>
          {!entitlements.features.length && (
            <p className="text-sm text-slate-500">Subscribe to unlock features.</p>
          )}
        </div>
        <div className="text-sm text-slate-600">
          <p>
            Users: {entitlements.limits.users ?? '—'} · Contacts:{' '}
            {entitlements.limits.contacts ?? 'unlimited'}
          </p>
        </div>
        <UpgradeCta />
      </div>
    </AccountBillingShell>
  );
}
