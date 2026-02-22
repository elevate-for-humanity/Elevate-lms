import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/reports/charts' },
  title: 'Charts & Visualizations | Elevate For Humanity',
  description: 'Visual data charts and analytics dashboards.',
};

export default async function ChartsPage() {
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
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/reports" className="hover:text-primary">Reports</Link></li><li>/</li><li className="text-gray-900 font-medium">Charts</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Charts & Visualizations</h1>
          <p className="text-gray-600 mt-2">Visual analytics and data dashboards</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="font-semibold mb-4">Enrollment Trends</h3><div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-500">Chart placeholder</div></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="font-semibold mb-4">Completion Rates</h3><div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-500">Chart placeholder</div></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="font-semibold mb-4">Program Distribution</h3><div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-500">Chart placeholder</div></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="font-semibold mb-4">Outcome Metrics</h3><div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-500">Chart placeholder</div></div>
        </div>
      </div>
    </div>
  );
}
