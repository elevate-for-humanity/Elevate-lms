import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import TenantsClient from './TenantsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/tenants' },
  title: 'Tenant Management | Elevate For Humanity',
  description: 'Manage multi-tenant organizations and configurations.',
};

export default async function TenantsPage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const { data: tenants, count } = await supabase
    .from('tenants')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li><Link href="/admin" className="hover:text-brand-blue-600">Admin</Link></li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Tenants</li>
            </ol>
          </nav>
        </div>
        <TenantsClient initialTenants={tenants ?? []} totalCount={count ?? 0} />
      </div>
    </div>
  );
}
