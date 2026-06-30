import { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import EnvManagerClient from './EnvManagerClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Environment Manager | Admin | Elevate LMS',
  description: 'Manage API keys and integration settings stored in platform_settings.',
};

export default async function EnvManagerPage() {
  await requireAdmin();
  return (
    <div className="w-full">
      <div className="px-6 pt-6 max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Integrations', href: '/admin/integrations' },
            { label: 'Environment Manager' },
          ]}
        />
        <p className="mt-2 text-xs text-slate-500">
          Use{' '}
          <code className="rounded bg-slate-100 px-1"></code> for this page.
          If you opened a <code className="rounded bg-slate-100 px-1">www.</code> link, you will be sent here
          automatically — that one-time redirect is normal.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Encrypted runtime secrets:{' '}
          <Link href="/admin/settings/integrations" className="text-brand-blue-600 underline">
            Dev Studio → Secrets
          </Link>
          . Container env:{' '}
          <Link href="/admin/studio" className="text-brand-blue-600 underline">
            Dev Studio → Environments
          </Link>
          .
        </p>
      </div>
      <EnvManagerClient />
    </div>
  );
}
