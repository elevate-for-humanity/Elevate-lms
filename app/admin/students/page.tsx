import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  GraduationCap,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import UserManagementClient from '@/app/admin/users/UserManagementClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/students',
  },
  title: 'Students Management | Elevate For Humanity',
  description:
    'Manage student enrollments, track progress, and monitor academic performance.',
};

export default async function StudentsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch students with enrollment data
  const { data: students, count: totalStudents } = await db
    .from('profiles')
    .select(
      `
      *,
      enrollments:enrollments(
        id,
        status,
        progress,
        program:programs(name, slug)
      )
    `,
      { count: 'exact' }
    )
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(50);

  // Get active enrollments count
  const { count: activeEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get completed enrollments count
  const { count: completedEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Get recent students (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: recentStudents } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
    .gte('created_at', weekAgo.toISOString());

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Students' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/admin-students-hero.jpg"
          alt="Students Management"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-11 w-11 text-brand-blue-600" />
                  <h3 className="text-sm font-medium text-black">
                    Total Students
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {totalStudents || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <GraduationCap className="h-11 w-11 text-brand-green-600" />
                  <h3 className="text-sm font-medium text-black">
                    Active Enrollments
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-green-600">
                  {activeEnrollments || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-11 w-11 text-brand-blue-600" />
                  <h3 className="text-sm font-medium text-black">
                    Completed
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {completedEnrollments || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-11 w-11 text-brand-orange-600" />
                  <h3 className="text-sm font-medium text-black">
                    New (7 days)
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-orange-600">
                  {recentStudents || 0}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <UserManagementClient
        initialUsers={(students ?? []).map((s: any) => ({
          id: s.id,
          email: s.email ?? '',
          full_name: s.full_name ?? '',
          role: s.role ?? 'student',
          phone: s.phone ?? '',
          is_active: s.is_active ?? true,
          created_at: s.created_at,
        }))}
        stats={{
          total: totalStudents ?? 0,
          active: activeEnrollments ?? 0,
          students: totalStudents ?? 0,
          instructors: 0,
          admins: 0,
          employers: 0,
        }}
      />
    </div>
  );
}
