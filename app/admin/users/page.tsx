import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import UserManagementClient from './UserManagementClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'User Management | Elevate For Humanity',
  description: 'Manage all platform users - create, edit, and manage user accounts.',
};

export default async function UsersPage() {
  const supabase = await createClient();


  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  // Fetch all users
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Calculate stats
  const allUsers = users || [];
  const stats = {
    total: allUsers.length,
    active: allUsers.filter(u => u.is_active !== false).length,
    students: allUsers.filter(u => u.role === 'student').length,
    instructors: allUsers.filter(u => u.role === 'instructor').length,
    admins: allUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
    employers: allUsers.filter(u => u.role === 'employer').length,
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]} />
        </div>
      </div>
      <UserManagementClient initialUsers={allUsers} stats={stats} />
    </div>
  );
}
