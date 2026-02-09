import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  BookOpen,
  Clock,
  Award,
  MessageCircle,
  Calendar,
  TrendingUp,
  FileText,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Student Portal | Elevate',
  description: 'Access your courses, track progress, and manage your learning journey.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/student',
  },
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StudentPortalPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/student');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  // Get enrollment data
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, programs(name, code)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(5);

  // Get recent activity
  const { count: completedModules } = await supabase
    .from('module_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed');

  const quickLinks = [
    { href: '/student/courses', icon: BookOpen, label: 'My Courses', color: 'bg-blue-100 text-blue-600' },
    { href: '/student/progress', icon: TrendingUp, label: 'Progress', color: 'bg-green-100 text-green-600' },
    { href: '/student/hours/history', icon: Clock, label: 'Hours Log', color: 'bg-blue-100 text-blue-600' },
    { href: '/student/chat', icon: MessageCircle, label: 'Messages', color: 'bg-orange-100 text-orange-600' },
    { href: '/student/handbook', icon: FileText, label: 'Handbook', color: 'bg-pink-100 text-pink-600' },
    { href: '/lms/schedule', icon: Calendar, label: 'Schedule', color: 'bg-indigo-100 text-indigo-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student Portal' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-slate-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!
              </h1>
              <p className="text-blue-100 mt-1">Continue your learning journey</p>
            </div>
            <Link
              href="/lms/notifications"
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
            >
              <Bell className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{enrollments?.length || 0}</p>
                <p className="text-sm text-gray-500">Active Courses</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedModules || 0}</p>
                <p className="text-sm text-gray-500">Modules Done</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">24</p>
                <p className="text-sm text-gray-500">Hours Logged</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-sm text-gray-500">Badges Earned</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-center"
              >
                <div className={`w-12 h-12 ${link.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="font-medium text-gray-900">{link.label}</p>
              </Link>
            );
          })}
        </div>

        {/* Current Courses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Current Courses</h2>
            <Link href="/student/courses" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
          {enrollments && enrollments.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {enrollments.map((enrollment: any) => (
                <div key={enrollment.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {enrollment.programs?.name || 'Course'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {enrollment.programs?.code || 'In Progress'}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/lms/course/${enrollment.program_id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No active courses</p>
              <Link
                href="/programs"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
              >
                Browse Programs
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
            </div>
            <div className="px-6 py-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming deadlines</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Achievements</h2>
            </div>
            <div className="px-6 py-8 text-center">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Complete modules to earn badges</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
