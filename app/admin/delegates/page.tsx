import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/delegates' },
  title: 'Delegates Management | Elevate For Humanity',
  description: 'Manage delegate access and permissions.',
};

export default async function DelegatesPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();
  
  

  const { data: delegates } = await supabase
    .from('delegates')
    .select('*, profiles!inner(full_name, email)')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Delegates</li>
            </ol>
          </nav>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Delegates</h1>
              <p className="text-gray-600 mt-2">Manage users with delegated access</p>
            </div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Add Delegate</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y">
            {delegates && delegates.length > 0 ? (
              delegates.map((delegate: any) => (
                <div key={delegate.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-blue-600 font-medium">{(delegate.profiles?.full_name || 'U')[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium">{delegate.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{delegate.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-2 py-1 bg-brand-blue-100 text-brand-blue-800 rounded-full text-xs">{delegate.role || 'delegate'}</span>
                    <button className="text-brand-red-600 hover:text-brand-red-800 text-sm">Remove</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">No delegates configured</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
