import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/hr' },
  title: 'HR Dashboard | Elevate For Humanity',
  description: 'Human resources management dashboard.',
};

export default async function HRPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const hrModules = [
    { name: 'Employees', href: '/admin/hr/employees', description: 'Manage employee records', count: '24' },
    { name: 'Time Tracking', href: '/admin/hr/time', description: 'Track hours and attendance', count: '156h' },
    { name: 'Leave Management', href: '/admin/hr/leave', description: 'Handle leave requests', count: '3' },
    { name: 'Payroll', href: '/admin/hr/payroll', description: 'Process payroll', count: '$45K' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">HR</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="text-gray-600 mt-2">Human resources management</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {hrModules.map((module) => (
            <Link key={module.href} href={module.href} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold">{module.name}</h3>
                <span className="text-2xl font-bold text-brand-blue-600">{module.count}</span>
              </div>
              <p className="text-sm text-gray-500">{module.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
