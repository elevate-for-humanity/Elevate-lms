import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/mobile-sync' },
  title: 'Mobile Sync | Elevate For Humanity',
  description: 'Configure mobile app synchronization settings.',
};

export default async function MobileSyncPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">Mobile Sync</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Mobile Sync Settings</h1>
          <p className="text-gray-600 mt-2">Configure mobile app data synchronization</p>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Sync Status</h2>
            <div className="flex items-center gap-3 p-4 bg-brand-green-50 rounded-lg">
              <span className="w-3 h-3 bg-brand-green-500 rounded-full"></span>
              <div><p className="font-medium text-brand-green-800">Sync Active</p><p className="text-sm text-brand-green-700">Last sync: 2 minutes ago</p></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Sync Options</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between"><span>Auto-sync on WiFi</span><input type="checkbox" className="w-4 h-4 rounded" defaultChecked /></label>
              <label className="flex items-center justify-between"><span>Sync offline content</span><input type="checkbox" className="w-4 h-4 rounded" defaultChecked /></label>
              <label className="flex items-center justify-between"><span>Background sync</span><input type="checkbox" className="w-4 h-4 rounded" /></label>
            </div>
          </div>
          <button className="w-full bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Force Sync Now</button>
        </div>
      </div>
    </div>
  );
}
