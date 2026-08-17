import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Integrations | Admin Settings' };

export default async function IntegrationSettingsPage() {
  await requireRole(['admin']);

  const integrations = [
    {
      title: 'Environment Manager',
      description: 'Review runtime/configuration status and manage non-secret platform settings',
      href: '/integrations/env-manager',
    },
    {
      title: 'Integration Status',
      description: 'Review external service connections and required runtime variables',
      href: '/integrations',
    },
    {
      title: 'Dev Studio',
      description: 'Manage builder tools and internal platform workflows',
      href: '/studio',
    },
    {
      title: 'Social Media Accounts',
      description: 'Connect supported social-media integrations',
      href: '/settings/social-media',
    },
  ];

  return (
    <div className="w-full space-y-6 px-6 py-6">
      <div>
        <p className="text-sm font-medium text-slate-700">
          <Link href="/settings" className="hover:text-slate-950">Settings</Link> / Integrations
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Integrations &amp; Webhooks</h1>
        <p className="text-slate-700">
          External service connections, runtime configuration, and platform integration status.
        </p>
      </div>

      <div className="max-w-xl space-y-3">
        {integrations.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group flex items-center justify-between rounded-xl border border-slate-200 p-5 transition-all hover:border-brand-blue-300 hover:shadow-sm"
          >
            <div>
              <p className="text-sm font-bold text-slate-950">{item.title}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-700">{item.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 transition-colors group-hover:text-brand-blue-700" />
          </Link>
        ))}
      </div>

      <div className="max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-5">
        <p className="mb-2 text-sm font-bold text-amber-950">Configuration rule</p>
        <div className="space-y-1 text-xs font-medium leading-5 text-amber-950">
          <p><strong>Production secret keys</strong> — configure on the Northflank service that consumes them, then redeploy that service if a fresh runtime is required.</p>
          <p><strong>platform_settings</strong> — non-secret application configuration only; values are stored as plaintext database settings.</p>
          <p><strong>process.env</strong> — runtime environment injected into the dedicated Admin, LMS, or Marketing container.</p>
        </div>
      </div>
    </div>
  );
}
