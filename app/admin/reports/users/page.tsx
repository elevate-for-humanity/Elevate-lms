import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ArrowLeft, Users, UserPlus, Shield, GraduationCap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'User Activity Report | Admin',
  description: 'View user registrations and platform engagement',
};

export default async function UsersReportPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: users },
    { count: totalUsers },
  ] = await Promise.all([
    db
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  const recentUsers = users?.filter(u => 
    new Date(u.created_at) > new Date(thirtyDaysAgo)
  ) || [];

  // Count by role
  const usersByRole: Record<string, number> = {};
  users?.forEach(u => {
    const role = u.role || 'user';
    usersByRole[role] = (usersByRole[role] || 0) + 1;
  });

  const roleColors: Record<string, { bg: string; text: string; icon: typeof Users }> = {
    super_admin: { bg: 'bg-brand-red-100', text: 'text-brand-red-700', icon: Shield },
    admin: { bg: 'bg-brand-blue-100', text: 'text-brand-blue-700', icon: Shield },
    instructor: { bg: 'bg-brand-blue-100', text: 'text-brand-blue-700', icon: GraduationCap },
    student: { bg: 'bg-brand-green-100', text: 'text-brand-green-700', icon: Users },
    user: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Users },
  };

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    instructor: 'Instructor',
    student: 'Student',
    user: 'User',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/admin/reports"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">User Activity Report</h1>
          <p className="text-gray-600">User registrations, roles, and platform engagement</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-brand-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Total Users</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalUsers || 0}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-green-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-brand-green-600" />
              </div>
              <span className="text-sm text-gray-600">New This Month</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{recentUsers.length}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <Shield className="w-5 h-5 text-brand-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Admins</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {(usersByRole['admin'] || 0) + (usersByRole['super_admin'] || 0)}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-orange-100 rounded-lg">
                <GraduationCap className="w-5 h-5 text-brand-orange-600" />
              </div>
              <span className="text-sm text-gray-600">Students</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{usersByRole['student'] || 0}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
              <Link href="/admin/users" className="text-sm text-brand-blue-600 hover:text-brand-blue-700">
                View All
              </Link>
            </div>
            {users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">User</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Role</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 10).map((user) => {
                      const role = user.role || 'user';
                      const roleStyle = roleColors[role] || roleColors.user;
                      return (
                        <tr key={user.id} className="border-b last:border-0">
                          <td className="py-3 px-2">
                            <p className="font-medium text-gray-900">
                              {user.first_name || 'Unknown'} {user.last_name || ''}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${roleStyle.bg} ${roleStyle.text}`}>
                              {roleLabels[role] || role}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No users found</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h2>
            {Object.keys(usersByRole).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(usersByRole)
                  .sort((a, b) => b[1] - a[1])
                  .map(([role, count]) => {
                    const roleStyle = roleColors[role] || roleColors.user;
                    const Icon = roleStyle.icon;
                    return (
                      <div key={role} className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${roleStyle.bg}`}>
                          <Icon className={`w-4 h-4 ${roleStyle.text}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{roleLabels[role] || role}</span>
                            <span className="font-medium text-gray-900">{count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${roleStyle.bg.replace('100', '500')}`}
                              style={{ width: `${(count / (totalUsers || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
