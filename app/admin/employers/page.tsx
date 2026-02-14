import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/employers' },
  title: 'Employer Management | Elevate For Humanity',
  description: 'Manage employer partnerships and job opportunities.',
};

export default async function EmployersPage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: employers, count } = await supabase.from('employers').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(20);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">Employers</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">Employer Management</h1><p className="text-gray-600 mt-2">{count || 0} employer partners</p></div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Add Employer</button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y">
            {employers && employers.length > 0 ? employers.map((employer: any) => (
              <div key={employer.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center"><span className="text-brand-blue-600 font-bold text-lg">{(employer.name || 'E')[0]}</span></div>
                  <div><p className="font-medium">{employer.name}</p><p className="text-sm text-gray-500">{employer.industry} • {employer.location}</p></div>
                </div>
                <Link href={`/admin/employers/${employer.id}`} className="text-brand-blue-600 hover:text-brand-blue-800 text-sm">View Details</Link>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No employers added yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
