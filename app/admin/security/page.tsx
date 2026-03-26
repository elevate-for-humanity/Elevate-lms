import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/security' },
  title: 'Security Settings | Elevate For Humanity',
  description: 'Manage platform security settings and access controls.',
};

export default async function SecurityPage() {
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
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">Security</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-600 mt-2">Configure platform security and access controls</p>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Authentication</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between"><span>Require two-factor authentication</span><input type="checkbox" className="w-4 h-4 rounded" /></label>
              <label className="flex items-center justify-between"><span>Allow social login</span><input type="checkbox" className="w-4 h-4 rounded" defaultChecked /></label>
              <label className="flex items-center justify-between"><span>Session timeout (minutes)</span><input type="number" className="w-20 border rounded px-2 py-1" defaultValue={60} /></label>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Password Policy</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between"><span>Minimum password length</span><input type="number" className="w-20 border rounded px-2 py-1" defaultValue={8} /></label>
              <label className="flex items-center justify-between"><span>Require special characters</span><input type="checkbox" className="w-4 h-4 rounded" defaultChecked /></label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
