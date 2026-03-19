import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import EnrollmentManagementClient from './EnrollmentManagementClient';
import AutomatedEnrollmentWorkflow from '@/components/AutomatedEnrollmentWorkflow';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Enrollment Management | Admin Dashboard',
  description: 'Manage student course enrollments - create, edit, and track progress.',
};

export default async function AdminEnrollmentsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  // Fetch enrollments with student and course details
  const { data: enrollments } = await db
    .from('training_enrollments')
    .select(`
      *,
      student:profiles(id, full_name, email),
      course:training_courses(id, title)
    `)
    .order('enrolled_at', { ascending: false });

  // Fetch users for dropdown (students)
  const { data: users } = await db
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name');

  // Fetch courses for dropdown
  const { data: coursesRaw } = await db
    .from('courses')
    .select('id, title')
    .eq('is_active', true)
    .order('title');

  // Map title to title for the client component
  const courses = (coursesRaw || []).map(c => ({ id: c.id, title: c.title }));

  // Fetch cohorts for dropdown
  const { data: cohortsRaw } = await db
    .from('cohorts')
    .select('id, name, code, status')
    .eq('status', 'active')
    .order('name');

  const cohorts = cohortsRaw || [];

  const allEnrollments = enrollments || [];
  const stats = {
    total: allEnrollments.length,
    active: allEnrollments.filter(e => e.status === 'active').length,
    completed: allEnrollments.filter(e => e.status === 'completed').length,
    atRisk: allEnrollments.filter(e => e.at_risk).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Enrollments' }]} />
        </div>
      </div>
      {/* Hero Image */}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <AutomatedEnrollmentWorkflow showStats={true} />
        </div>
      </div>
      <EnrollmentManagementClient 
        initialEnrollments={allEnrollments} 
        users={users || []} 
        courses={courses || []} 
        cohorts={cohorts}
        stats={stats} 
      />
    </div>
  );
}
