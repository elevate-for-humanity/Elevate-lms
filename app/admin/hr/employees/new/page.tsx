import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/hr/employees/new' },
  title: 'Add Employee | Elevate For Humanity',
  description: 'Add a new employee to the system.',
};

export default async function NewEmployeePage() {
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
        <Image src="/images/pages/admin-hr-employees-new-hero.jpg" alt="HR administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/hr" className="hover:text-primary">HR</Link></li><li>/</li><li><Link href="/admin/hr/employees" className="hover:text-primary">Employees</Link></li><li>/</li><li className="text-gray-900 font-medium">New</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Add Employee</h1>
          <p className="text-gray-600 mt-2">Create a new employee record</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label><input type="text" className="w-full border rounded-lg px-3 py-2" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label><input type="text" className="w-full border rounded-lg px-3 py-2" required /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Email *</label><input type="email" className="w-full border rounded-lg px-3 py-2" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Department</label><select className="w-full border rounded-lg px-3 py-2"><option>Select department</option><option>Operations</option><option>Training</option><option>Administration</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Role</label><select className="w-full border rounded-lg px-3 py-2"><option>Select role</option><option>Staff</option><option>Manager</option><option>Admin</option></select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label><input type="date" className="w-full border rounded-lg px-3 py-2" /></div>
            <div className="flex gap-4 pt-4 border-t">
              <button type="submit" className="flex-1 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Add Employee</button>
              <Link href="/admin/hr/employees" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
