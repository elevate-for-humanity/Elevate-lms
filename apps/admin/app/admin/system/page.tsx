import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Server, Webhook, Activity, Database, Shield, Settings } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'System | Admin',
};

const SECTIONS = [
  { label: 'Background Jobs', description: 'View and retry failed background jobs', href: '/admin/system/jobs', icon: Activity },
  { label: 'Webhooks', description: 'Monitor webhook delivery health and failures', href: '/admin/system/webhooks', icon: Webhook },
  { label: 'System Health', description: 'Live service and API health checks', href: '/admin/system-health', icon: Server },
  { label: 'Audit Logs', description: 'Full audit trail of admin actions', href: '/admin/audit-logs', icon: Shield },
  { label: 'Dev Studio', description: 'Terminal, editor, AI assistant, and deploy controls', href: '/admin/dashboard', icon: Database },
  { label: 'Settings', description: 'Platform configuration and integrations', href: '/admin/settings', icon: Settings },
];

export default async function SystemPage() {
  await requireRole(['admin']);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'System' }]} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">System</h1>
        <p className="text-sm text-slate-500 mb-8">Infrastructure, jobs, webhooks, and platform configuration.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map(({ label, description, href, icon: Icon }) => (
            <Link key={href} href={href}
              className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-slate-300 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-brand-blue-50 transition-colors">
                  <Icon className="w-4 h-4 text-slate-600 group-hover:text-brand-blue-600" />
                </div>
                <h2 className="font-semibold text-slate-900">{label}</h2>
              </div>
              <p className="text-sm text-slate-500">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
