import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/tenants' },
  title: 'Tenant Management | Elevate For Humanity',
  description: 'Manage multi-tenant organizations and configurations.',
};

export default async function TenantsPage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: tenants, count } = await supabase.from('tenants').select('*', { count: 'exact' }).order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">Tenants</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1><p className="text-gray-600 mt-2">{count || 0} organizations</p></div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Add Tenant</button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y">
            {tenants && tenants.length > 0 ? tenants.map((tenant: any) => (
              <div key={tenant.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center"><span className="text-brand-blue-600 font-bold">{(tenant.name || 'T')[0]}</span></div>
                  <div><p className="font-medium">{tenant.name}</p><p className="text-sm text-gray-500">{tenant.domain || 'No domain'}</p></div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${tenant.status === 'active' ? 'bg-brand-green-100 text-brand-green-800' : 'bg-gray-100 text-gray-600'}`}>{tenant.status || 'active'}</span>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No tenants configured</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
