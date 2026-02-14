import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/program-holder/settings' },
  title: 'Program Settings | Elevate For Humanity',
  description: 'Configure your program holder account settings.',
};

export default async function ProgramSettingsPage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/program-holder" className="hover:text-primary">Program Holder</Link></li><li>/</li><li className="text-gray-900 font-medium">Settings</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Program Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account and program preferences</p>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Organization Information</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label><input type="text" className="w-full border rounded-lg px-3 py-2" defaultValue={profile?.organization || ''} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label><input type="email" className="w-full border rounded-lg px-3 py-2" defaultValue={profile?.email || ''} /></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Notifications</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between"><span>Email notifications for new enrollments</span><input type="checkbox" className="w-4 h-4 rounded" defaultChecked /></label>
              <label className="flex items-center justify-between"><span>Weekly progress reports</span><input type="checkbox" className="w-4 h-4 rounded" defaultChecked /></label>
            </div>
          </div>
          <button className="w-full bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Save Settings</button>
        </div>
      </div>
    </div>
  );
}
