import { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import EnvManagerClient from './EnvManagerClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Environment Manager | Admin | Elevate LMS',
  description: 'Review runtime configuration and manage non-secret platform settings.',
  robots: { index: false, follow: false },
};

export default async function EnvManagerPage() {
  await requireAdmin();
  return (
    <div className="w-full">
      <div className="mx-auto max-w-5xl px-6 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Integrations', href: '/integrations' },
            { label: 'Environment Manager' },
          ]}
        />
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-950">
          Secret values entered here are routed to the protected runtime-secret store and are masked
          after saving. Use the dedicated Grok setup page for a simpler mobile save-and-test flow.
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700">
          Admin runtime:{' '}
          <code className="rounded bg-slate-100 px-1">admin.elevateforhumanity.org</code>. After
          changing a Northflank runtime variable, redeploy the owning service when a fresh container
          is required.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold">
          <Link href="/integrations" className="text-brand-blue-700 underline">
            Integration status
          </Link>
          <Link href="/settings/grok" className="text-brand-blue-700 underline">
            Grok / xAI setup
          </Link>
          <Link href="/studio" className="text-brand-blue-700 underline">
            Dev Studio
          </Link>
          <Link href="/dashboard" className="text-brand-blue-700 underline">
            Admin dashboard
          </Link>
        </div>
      </div>
      <EnvManagerClient />
    </div>
  );
}
