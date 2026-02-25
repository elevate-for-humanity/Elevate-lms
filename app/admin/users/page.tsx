import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import UserManagementClient from './UserManagementClient';

export const metadata: Metadata = {
  title: 'User Management | Elevate For Humanity',
  description: 'Manage all platform users - create, edit, and manage user accounts.',
};

export default async function UsersPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  // Fetch all users
  const { data: users } = await db
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
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]} />
        </div>
      </div>
      <UserManagementClient initialUsers={allUsers} stats={stats} />
    </div>
  );
}
