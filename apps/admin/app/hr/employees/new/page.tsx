import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { createEmployeeAction } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/hr/employees/new' },
  title: 'Add Employee | Elevate For Humanity',
  description: 'Add a new employee to the system.',
};

export default async function NewEmployeePage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li>
                <Link href="/admin" className="hover:text-primary">
                  Admin
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/admin/hr" className="hover:text-primary">
                  HR
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/admin/hr/employees" className="hover:text-primary">
                  Employees
                </Link>
              </li>
              <li>/</li>
              <li className="text-slate-900 font-medium">New</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Add Employee</h1>
          <p className="text-slate-700 mt-2">Create a new employee record</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form action={createEmployeeAction} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  First Name *
                </label>
                <input
                  name="first_name"
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Last Name *</label>
                <input
                  name="last_name"
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Email *</label>
              <input
                name="email"
                type="email"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Department</label>
                <select
                  name="department"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500"
                >
                  <option value="">Select department</option>
                  <option value="Operations">Operations</option>
                  <option value="Training">Training</option>
                  <option value="Administration">Administration</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Role</label>
                <select
                  name="role"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Start Date</label>
              <input
                name="hire_date"
                type="date"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="submit"
                className="flex-1 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 font-medium transition-colors"
              >
                Add Employee
              </button>
              <Link
                href="/admin/hr/employees"
                className="px-4 py-2 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
