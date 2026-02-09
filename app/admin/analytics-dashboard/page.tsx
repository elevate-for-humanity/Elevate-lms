import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, BookOpen, GraduationCap, TrendingUp, 
  DollarSign, Clock, Award, BarChart3,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Admin',
  robots: { index: false, follow: false },
};

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

function MetricCard({ title, value, change, icon, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span>{Math.abs(change)}% vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default async function AnalyticsDashboardPage() {
  const supabase = await createClient();

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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin', 'staff'].includes(profile?.role || '')) {
    redirect('/unauthorized');
  }

  // Fetch metrics
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

  // Total students
  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // New students this month
  const { count: newStudentsThisMonth } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
    .gte('created_at', thisMonth);

  // New students last month
  const { count: newStudentsLastMonth } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
    .gte('created_at', lastMonth)
    .lt('created_at', thisMonth);

  // Active enrollments
  const { count: activeEnrollments } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Completed enrollments
  const { count: completedEnrollments } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Total courses
  const { count: totalCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Total programs
  const { count: totalPrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // Calculate changes
  const studentChange = newStudentsLastMonth 
    ? Math.round(((newStudentsThisMonth || 0) - newStudentsLastMonth) / newStudentsLastMonth * 100)
    : 0;

  // Completion rate
  const totalEnrollments = (activeEnrollments || 0) + (completedEnrollments || 0);
  const completionRate = totalEnrollments > 0 
    ? Math.round((completedEnrollments || 0) / totalEnrollments * 100)
    : 0;

  // Recent enrollments
  const { data: recentEnrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      progress,
      enrolled_at,
      profiles:user_id (full_name, email),
      courses:course_id (course_name)
    `)
    .order('enrolled_at', { ascending: false })
    .limit(10);

  // Program distribution
  const { data: programStats } = await supabase
    .from('programs')
    .select('category')
    .eq('is_active', true);

  const categoryCount: Record<string, number> = {};
  programStats?.forEach(p => {
    const cat = p.category || 'Other';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Analytics Dashboard' }]} />
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time insights into platform performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Students"
            value={totalStudents?.toLocaleString() || 0}
            change={studentChange}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            color="bg-blue-100"
          />
          <MetricCard
            title="Active Enrollments"
            value={activeEnrollments?.toLocaleString() || 0}
            icon={<BookOpen className="w-6 h-6 text-green-600" />}
            color="bg-green-100"
          />
          <MetricCard
            title="Completion Rate"
            value={`${completionRate}%`}
            icon={<GraduationCap className="w-6 h-6 text-blue-600" />}
            color="bg-blue-100"
          />
          <MetricCard
            title="Active Programs"
            value={totalPrograms || 0}
            icon={<Award className="w-6 h-6 text-orange-600" />}
            color="bg-orange-100"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="New Students (This Month)"
            value={newStudentsThisMonth || 0}
            icon={<TrendingUp className="w-6 h-6 text-teal-600" />}
            color="bg-teal-100"
          />
          <MetricCard
            title="Completed Courses"
            value={completedEnrollments?.toLocaleString() || 0}
            icon={<Award className="w-6 h-6 text-indigo-600" />}
            color="bg-indigo-100"
          />
          <MetricCard
            title="Active Courses"
            value={totalCourses || 0}
            icon={<BookOpen className="w-6 h-6 text-pink-600" />}
            color="bg-pink-100"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Enrollments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Enrollments</h2>
            <div className="space-y-4">
              {recentEnrollments?.slice(0, 5).map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">
                      {enrollment.profiles?.full_name || enrollment.profiles?.email || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {enrollment.courses?.course_name || 'Unknown Course'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      enrollment.status === 'active' ? 'bg-green-100 text-green-700' :
                      enrollment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {enrollment.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {enrollment.progress || 0}% complete
                    </p>
                  </div>
                </div>
              ))}
              {(!recentEnrollments || recentEnrollments.length === 0) && (
                <p className="text-gray-500 text-center py-4">No recent enrollments</p>
              )}
            </div>
          </div>

          {/* Program Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Programs by Category</h2>
            <div className="space-y-4">
              {Object.entries(categoryCount).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-gray-700 capitalize">{category.replace(/-/g, ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(count / (totalPrograms || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/students" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Manage Students</span>
            </Link>
            <Link href="/admin/enrollments" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
              <BookOpen className="w-5 h-5 text-green-600" />
              <span className="font-medium">View Enrollments</span>
            </Link>
            <Link href="/admin/programs" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Manage Programs</span>
            </Link>
            <Link href="/admin/reports" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              <span className="font-medium">Generate Reports</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
