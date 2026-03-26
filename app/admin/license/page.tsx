import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/license' },
  title: 'License Management | Elevate For Humanity',
  description: 'Manage platform licenses and subscriptions.',
};

export default async function LicensePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">License</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">License Management</h1>
          <p className="text-gray-600 mt-2">View and manage your platform license</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Current License</h2>
            <span className="px-3 py-1 bg-brand-green-100 text-brand-green-800 rounded-full text-sm font-medium">Active</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-500">License Type</p><p className="font-medium">Enterprise</p></div>
            <div><p className="text-sm text-gray-500">Valid Until</p><p className="font-medium">Dec 31, 2025</p></div>
            <div><p className="text-sm text-gray-500">User Seats</p><p className="font-medium">Unlimited</p></div>
            <div><p className="text-sm text-gray-500">Support Level</p><p className="font-medium">Premium</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">License Key</h2>
          <div className="flex gap-2">
            <input type="text" className="flex-1 border rounded-lg px-3 py-2 font-mono text-sm" value="XXXX-XXXX-XXXX-XXXX" readOnly />
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}
