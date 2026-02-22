import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/mou' },
  title: 'MOU Management | Elevate For Humanity',
  description: 'Manage memorandums of understanding with partners.',
};

export default async function MOUPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: mous, count } = await db.from('partner_mous').select('*, partners:partner_id(name)', { count: 'exact' }).order('created_at', { ascending: false }).limit(20);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">MOUs</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">MOU Management</h1><p className="text-gray-600 mt-2">Manage partnership agreements</p></div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Create MOU</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Total MOUs</h3><p className="text-3xl font-bold text-gray-900 mt-2">{count || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Active</h3><p className="text-3xl font-bold text-brand-green-600 mt-2">{mous?.filter((m: any) => m.status === 'active').length || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Pending</h3><p className="text-3xl font-bold text-yellow-600 mt-2">{mous?.filter((m: any) => m.status === 'pending').length || 0}</p></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y">
            {mous && mous.length > 0 ? mous.map((mou: any) => (
              <div key={mou.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div><p className="font-medium">{mou.partners?.name || 'Partner'}</p><p className="text-sm text-gray-500">{mou.mou_version || 'Standard'} • Expires: {mou.expiry_date ? new Date(mou.expiry_date).toLocaleDateString() : 'N/A'}</p></div>
                <span className={`px-2 py-1 rounded-full text-xs ${mou.status === 'active' ? 'bg-brand-green-100 text-brand-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{mou.status || 'pending'}</span>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No MOUs found</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
