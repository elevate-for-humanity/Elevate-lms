import { requireRole } from '@/lib/auth/require-role';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ShoppingBag, Users, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getAccountOrganizationId } from '@/lib/account/organization-context';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getOrganizationFeatures } from '@/lib/platform/organization-features';
import { CapabilityUpgradeGrid } from '@/components/billing/CapabilityUpgradeGrid';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Marketplace | Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export default async function AdminMarketplacePage() {
  await requireRole(['admin', 'staff']);
  const db = await createClient();

  const [{ count: productCount }, { count: creatorCount }, { count: pendingPayouts }] = await Promise.all([
    db.from('marketplace_products').select('*', { count: 'exact', head: true }),
    db.from('marketplace_creators').select('*', { count: 'exact', head: true }),
    db.from('marketplace_creators').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const orgId = await getAccountOrganizationId();
  let ownedFeatures: string[] = [];
  let planName: string | null = null;
  if (orgId) {
    const adminDb = await requireAdminClient();
    const entitlements = adminDb
      ? await getOrganizationFeatures(orgId, adminDb)
      : await getOrganizationFeatures(orgId);
    ownedFeatures = entitlements.features;
    planName = entitlements.planName;
  }

  const sections = [
    {
      name: 'Products',
      href: '/marketplace/products',
      icon: ShoppingBag,
      description: 'Review and approve creator marketplace product listings.',
      count: productCount ?? 0,
      label: 'products',
    },
    {
      name: 'Creators',
      href: '/marketplace/creators',
      icon: Users,
      description: 'Manage creator accounts and approval status.',
      count: creatorCount ?? 0,
      label: 'creators',
    },
    {
      name: 'Payouts',
      href: '/marketplace/payouts',
      icon: DollarSign,
      description: 'Track and process creator payout requests.',
      count: pendingPayouts ?? 0,
      label: 'pending',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Marketplace' }]} />

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red-700">Unified commerce</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Marketplace & Platform Capabilities</h1>
          <p className="mt-3 max-w-3xl text-slate-600">Manage creator products and see the same platform capability catalog used by the public Store and LMS billing experience.</p>
          <p className="mt-3 text-sm font-bold text-slate-700">Organization plan: {planName || 'not linked'}</p>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {sections.map((section) => (
            <Link key={section.href} href={section.href} className="rounded-lg border bg-white p-6 transition-shadow hover:shadow-md">
              <section.icon className="mb-3 h-8 w-8 text-brand-blue-600" />
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold text-slate-900">{section.name}</h2>
                <span className="text-2xl font-bold tabular-nums text-slate-900">{section.count}</span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{section.label}</p>
              <p className="mt-2 text-sm text-slate-700">{section.description}</p>
            </Link>
          ))}
        </section>

        <CapabilityUpgradeGrid ownedFeatures={ownedFeatures} />
      </div>
    </main>
  );
}
