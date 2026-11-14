import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  canManageStaffPortalUsers,
  requireStaffPortalAccess,
} from '@/lib/staff-portal/access';

export const metadata: Metadata = {
  title: 'Staff Portal Users',
  description: 'Elevate For Humanity - Staff Portal Users page',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StaffPortalUsersPage() {
  const { profile } = await requireStaffPortalAccess();

  if (!canManageStaffPortalUsers(profile.role)) {
    redirect('/unauthorized');
  }

  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, role, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-black">Failed to load users. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">User Management</h1>
          <p className="mt-2 text-black">Manage user accounts and permissions</p>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-black">All Users ({users?.length || 0})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {user.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-2 text-xs font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'staff'
                                ? 'bg-blue-100 text-blue-800'
                                : user.role === 'instructor'
                                  ? 'bg-brand-green-100 text-brand-green-800'
                                  : 'bg-slate-100 text-black'
                          }`}
                        >
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-black">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
