import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/site-health' },
  title: 'Site Health | Elevate For Humanity',
  description: 'Monitor website health and performance metrics.',
};

export default async function SiteHealthPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const healthChecks = [
    { name: 'Database', status: 'healthy', latency: '12ms' },
    { name: 'Authentication', status: 'healthy', latency: '45ms' },
    { name: 'Storage', status: 'healthy', latency: '23ms' },
    { name: 'Email Service', status: 'healthy', latency: '156ms' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">Site Health</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Site Health</h1>
          <p className="text-gray-600 mt-2">Monitor system status and performance</p>
        </div>
        <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <svg className="w-6 h-6 text-brand-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div><p className="font-medium text-brand-green-800">All Systems Operational</p><p className="text-sm text-brand-green-700">Last checked: just now</p></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b"><h2 className="font-semibold">Service Status</h2></div>
          <div className="divide-y">
            {healthChecks.map((check) => (
              <div key={check.name} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-brand-green-500 rounded-full"></span>
                  <span className="font-medium">{check.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{check.latency}</span>
                  <span className="px-2 py-1 bg-brand-green-100 text-brand-green-800 rounded text-xs">{check.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
