import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Integrations | Admin Settings' };

export default async function IntegrationSettingsPage() {
  await requireRole(['admin', 'super_admin']);

  const integrations = [
    {
      title: 'Environment Variables',
      description: 'Manage integration keys, API tokens, and service configuration',
      href: '/admin/integrations/env-manager',
    },
    {
      title: 'Platform Secrets',
      description: 'Encrypted secrets store — API keys loaded at runtime by lib/secrets.ts',
      href: '/admin/settings/integrations',
    },
    {
      title: 'Northflank Containers',
      description: 'Push environment variables to the LMS and admin container services',
      href: '/admin/integrations/env-manager',
    },
    {
      title: 'Social Media Accounts',
      description: 'Connect Globe, Instagram, YouTube, and Globe/X accounts',
      href: '/admin/settings/social-media',
    },
  ];

  return (
    <div className="w-full space-y-6 px-6 py-6">
      <div>
        <p className="text-sm font-medium text-slate-500">
          <Link href="/admin/settings" className="hover:text-slate-700">Settings</Link> / Integrations
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Integrations & Webhooks</h1>
        <p className="text-slate-500">
          External service connections and API configuration.
        </p>
      </div>

      <div className="max-w-xl space-y-3">
        {integrations.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex items-center justify-between p-5 rounded-xl border border-slate-200 hover:border-brand-blue-300 hover:shadow-sm transition-all group"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 transition-colors" />
          </Link>
        ))}
      </div>

      <div className="max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-medium text-amber-900 mb-2">Configuration hierarchy</p>
        <div className="text-xs text-amber-800 space-y-1">
          <p><strong>platform_secrets</strong> (Dev Studio → Secrets) — encrypted, highest priority at runtime</p>
          <p><strong>app_secrets</strong> (Dev Studio → Container env) — development environment secrets</p>
          <p><strong>platform_settings</strong> (Env Manager) — plaintext config keys, integration settings</p>
          <p><strong>process.env</strong> (Northflank runtime env / .env.local) — base layer, lowest priority</p>
        </div>
      </div>
    </div>
  );
}
