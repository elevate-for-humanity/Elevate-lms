import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/analytics',
  },
  title: 'Analytics Dashboard | Elevate For Humanity',
  description: 'View platform analytics, user metrics, and performance data.',
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Analytics" }]} />
        </div>
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

  // Fetch analytics overview data
  const { count: totalUsers } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: totalCourses } = await db
    .from('training_courses')
    .select('*', { count: 'exact', head: true });

  const { count: totalEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true });

  const { count: totalPrograms } = await db
    .from('programs')
    .select('*', { count: 'exact', head: true });

  const analyticsCategories = [
    {
      title: 'Learning Analytics',
      description: 'Course completion rates, progress tracking, and educational outcomes',
      href: '/admin/analytics/learning',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'blue'
    },
    {
      title: 'Engagement Analytics',
      description: 'User activity, login patterns, and platform engagement metrics',
      href: '/admin/analytics/engagement',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'green'
    },
    {
      title: 'Program Analytics',
      description: 'Program performance, participant outcomes, and success metrics',
      href: '/admin/analytics/programs',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'blue'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-brand-blue-100 text-brand-blue-600',
      green: 'bg-brand-green-100 text-brand-green-600',
      blue: 'bg-brand-blue-100 text-brand-blue-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Analytics" }]} />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor platform performance and user metrics</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalUsers || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Courses</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalCourses || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Enrollments</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalEnrollments || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Programs</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalPrograms || 0}</p>
          </div>
        </div>

        {/* Analytics Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analyticsCategories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${getColorClasses(category.color)}`}>
                {category.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.title}</h3>
              <p className="text-gray-600 text-sm">{category.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
