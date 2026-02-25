import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import FrameworkSettingsPanel from '@/components/FrameworkSettingsPanel';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/settings' },
  title: 'Admin Settings | Elevate For Humanity',
  description: 'Configure platform settings and preferences.',
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">Settings</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600 mt-2">Configure system-wide settings</p>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">General Settings</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label><input type="text" className="w-full border rounded-lg px-3 py-2" defaultValue="Elevate For Humanity" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label><input type="email" className="w-full border rounded-lg px-3 py-2" defaultValue="info@elevateforhumanity.org" /></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Notifications</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between"><span>Email notifications</span><input type="checkbox" className="w-4 h-4 rounded" defaultChecked /></label>
              <label className="flex items-center justify-between"><span>System alerts</span><input type="checkbox" className="w-4 h-4 rounded" defaultChecked /></label>
            </div>
          </div>
          <button className="w-full bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Save Settings</button>

          {/* Framework Settings */}
          <div className="mt-8">
            <FrameworkSettingsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
