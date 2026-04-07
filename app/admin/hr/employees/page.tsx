import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/hr/employees' },
  title: 'Employee Directory | Elevate For Humanity',
  description: 'View and manage employee records.',
};

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: employees, count } = await supabase.from('employees').select('*', { count: 'exact' }).order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/hr" className="hover:text-primary">HR</Link></li><li>/</li><li className="text-gray-900 font-medium">Employees</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">Employee Directory</h1><p className="text-gray-600 mt-2">{count || 0} employees</p></div>
            <Link href="/admin/hr/employees/new" className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Add Employee</Link>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b"><input type="text" placeholder="Search employees..." className="w-full border rounded-lg px-3 py-2" /></div>
          <div className="divide-y">
            {employees && employees.length > 0 ? employees.map((emp: any) => (
              <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center"><span className="text-brand-blue-600 font-medium">{(emp.first_name || 'E')[0]}</span></div>
                  <div><p className="font-medium">{emp.first_name} {emp.last_name}</p><p className="text-sm text-gray-500">{emp.department} • {emp.role}</p></div>
                </div>
                <button className="text-brand-blue-600 hover:text-brand-blue-800 text-sm">View</button>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No employees found</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
