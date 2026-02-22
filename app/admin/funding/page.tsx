import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/funding' },
  title: 'Funding Management | Elevate For Humanity',
  description: 'Manage funding sources and grant allocations.',
};

export default async function FundingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">Funding</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Funding Management</h1>
          <p className="text-gray-600 mt-2">Track funding sources and allocations</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Total Funding</h3><p className="text-3xl font-bold text-brand-green-600 mt-2">$3.2M</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Allocated</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">$2.8M</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Available</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">$400K</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Active Grants</h3><p className="text-3xl font-bold text-brand-orange-600 mt-2">12</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/grants/revenue" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md"><h3 className="font-semibold mb-2">Grant Revenue</h3><p className="text-sm text-gray-500">Track grant income and disbursements</p></Link>
          <Link href="/admin/funding/allocations" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md"><h3 className="font-semibold mb-2">Allocations</h3><p className="text-sm text-gray-500">Manage funding allocations by program</p></Link>
        </div>
      </div>
    </div>
  );
}
