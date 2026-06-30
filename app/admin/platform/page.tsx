import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getPlatformHealth } from '@/lib/platform/platform-health';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: `Platform Console | Admin | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'SaaS provisioning, trials, workspaces, and platform operations.',
};

export default async function PlatformConsolePage() {
  await requireRole(['admin', 'super_admin']);

  const [health, db] = await Promise.all([getPlatformHealth(), requireAdminClient()]);

  const [
    { count: workspaceCount },
    { count: activeTrials },
    { count: provisioningJobs },
    { count: operatorTasks },
  ] = await Promise.all([
    db
      .from('customer_workspaces')
      .select('id', { count: 'exact', head: true }),
    db
      .from('managed_licenses')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'trial')
      .eq('status', 'active'),
    db
      .from('provisioning_jobs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['queued', 'processing']),
    db
      .from('operator_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'queued'),
  ]);

  const links = [
    { label: 'Tenants', href: '/admin/tenants', desc: 'Organization + tenant records' },
    { label: 'System health', href: '/admin/system-health', desc: 'Service connectivity' },
    { label: 'Store catalog', href: '/admin/store', desc: 'Plans and add-ons' },
    { label: 'Billing', href: '/admin/billing', desc: 'Subscriptions and invoices' },
    { label: 'Referrals', href: '/admin/referrals', desc: 'Partner referral program' },
    { label: 'Provisioning jobs', href: '/admin/system/jobs', desc: 'Async workspace jobs' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <Breadcrumbs
          items={[{ label: 'Admin', href: '/admin' }, { label: 'Platform Console' }]}
        />

        <div>
          <h1 className="text-2xl font-bold text-white">Platform Console</h1>
          <p className="mt-2 text-sm text-slate-400">
            Unified view for workspace provisioning, trials, and SaaS operations.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Platform health" value={health.overall} />
          <StatCard label="Workspaces" value={String(workspaceCount ?? 0)} />
          <StatCard label="Active trials" value={String(activeTrials ?? 0)} />
          <StatCard label="Queued jobs" value={String((provisioningJobs ?? 0) + (operatorTasks ?? 0))} />
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Quick links</h2>
          <ul className="mt-4 divide-y divide-slate-800">
            {links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex flex-col gap-0.5 py-3 text-brand-blue-300 hover:text-brand-blue-200 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-sm text-slate-500">{item.desc}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Customer launch funnel</h2>
          <p className="mt-2 text-sm text-slate-400">
            Canonical self-service entry:{' '}
            <a
              href={`${PLATFORM_DEFAULTS.siteUrl}/launch`}
              className="text-brand-blue-300 underline"
              target="_blank"
              rel="noreferrer"
            >
              /launch
            </a>{' '}
            → workspace provision → trial subdomain → operator.
          </p>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold capitalize text-white">{value}</p>
    </div>
  );
}
