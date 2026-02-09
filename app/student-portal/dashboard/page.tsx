import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Calendar,
  FileText,
  Users,
  Award,
  Clock,
  MessageSquare,
  Briefcase,
  GraduationCap,
  BarChart3,
  Bell,
  Settings,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Student Portal | Elevate For Humanity',
  description: 'Access your courses, track progress, view grades, and manage your schedule.',
};

export const dynamic = 'force-dynamic';

export default async function StudentPortalPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-700">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/student-portal');
  }

  // Single RPC call to get all dashboard data
  const { data: dashboard, error: rpcError } = await supabase.rpc('get_student_dashboard');

  // Fallback to empty state if RPC fails or returns null
  const enrollments = dashboard?.enrollments || [];
  const tasks = dashboard?.tasks || [];
  const announcements = dashboard?.announcements || [];
  const hours = dashboard?.hours || [];

  // Get profile separately (not in RPC)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get message count separately
  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false);

  const quickLinks = [
    { icon: BookOpen, title: 'My Courses', href: '/student-portal/courses', color: 'blue' },
    { icon: Calendar, title: 'Schedule', href: '/student-portal/schedule', color: 'green' },
    { icon: BarChart3, title: 'Grades', href: '/student-portal/grades', color: 'blue' },
    { icon: Users, title: 'Instructors', href: '/student-portal/instructors', color: 'orange' },
    { icon: Briefcase, title: 'Career Services', href: '/career-services', color: 'teal' },
    { icon: FileText, title: 'Documents', href: '/student-portal/documents', color: 'indigo' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || 'Student'}</h1>
              <p className="text-blue-100 mt-1">Your learning dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/student-portal/messages" className="relative p-2 bg-blue-500 rounded-lg hover:bg-blue-400">
                <MessageSquare className="w-5 h-5" />
                {messageCount && messageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {messageCount}
                  </span>
                )}
              </Link>
              <Link href="/student-portal/settings" className="p-2 bg-blue-500 rounded-lg hover:bg-blue-400">
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="bg-white rounded-xl border p-4 hover:shadow-md transition flex items-center gap-3"
                >
                  <div className={`w-10 h-10 bg-${link.color}-100 rounded-lg flex items-center justify-center`}>
                    <link.icon className={`w-5 h-5 text-${link.color}-600`} />
                  </div>
                  <span className="font-medium">{link.title}</span>
                </Link>
              ))}
            </div>

            {/* My Enrollments */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">My Programs</h2>
                <Link href="/student-portal/courses" className="text-blue-600 text-sm font-medium hover:underline">
                  View All
                </Link>
              </div>
              {enrollments.length > 0 ? (
                <div className="space-y-4">
                  {enrollments.map((enrollment: any) => (
                    <div key={enrollment.enrollment_id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0 relative">
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{enrollment.program_title || 'Untitled Program'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            enrollment.status === 'active' ? 'bg-green-100 text-green-700' :
                            enrollment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {enrollment.status}
                          </span>
                          {enrollment.progress > 0 && (
                            <>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: `${enrollment.progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-700">{enrollment.progress}%</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Link 
                        href={enrollment.next_action_href || `/programs/${enrollment.program_slug}`} 
                        className="text-blue-600 text-sm font-medium"
                      >
                        {enrollment.next_action_label || 'Continue'}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-700">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p>No programs enrolled yet</p>
                  <Link href="/programs" className="text-blue-600 font-medium hover:underline">
                    Browse Programs
                  </Link>
                </div>
              )}
            </div>

            {/* Hours Tracking (for apprenticeships) */}
            {hours.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Hours Progress</h2>
                  <Link href="/apprentice/hours" className="text-blue-600 text-sm font-medium hover:underline">
                    View Details
                  </Link>
                </div>
                <div className="space-y-4">
                  {hours.map((h: any, idx: number) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <h3 className="font-medium">{h.program_title}</h3>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-gray-700">Verified</p>
                          <p className="font-semibold text-green-600">{h.verified_hours || 0} hrs</p>
                        </div>
                        <div>
                          <p className="text-gray-700">Pending</p>
                          <p className="font-semibold text-yellow-600">{h.pending_hours || 0} hrs</p>
                        </div>
                        <div>
                          <p className="text-gray-700">Required</p>
                          <p className="font-semibold">{h.required_hours || 0} hrs</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks / Upcoming Deadlines */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Tasks & Deadlines</h2>
                <Link href="/student-portal/assignments" className="text-blue-600 text-sm font-medium hover:underline">
                  View All
                </Link>
              </div>
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-sm text-gray-700">{task.description}</p>
                      </div>
                      {task.due_date && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-orange-600">
                            {new Date(task.due_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-700">Due</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-700">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p>No pending tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Announcements */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold">Announcements</h2>
              </div>
              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-3">
                      <h3 className="font-medium text-sm">{announcement.title}</h3>
                      <p className="text-xs text-gray-700 mt-1">
                        {announcement.created_at ? new Date(announcement.created_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-700">No announcements</p>
              )}
            </div>

            {/* Certificates - keeping separate query for now */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">Certificates</h2>
              </div>
              <div className="text-center py-4 text-gray-700">
                <Award className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Complete programs to earn certificates</p>
              </div>
            </div>

            {/* Quick Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold mb-3">Need Help?</h3>
              <div className="space-y-2 text-sm">
                <Link href="/student-portal/handbook" className="block text-blue-600 hover:underline">
                  Student Handbook
                </Link>
                <Link href="/faq" className="block text-blue-600 hover:underline">
                  FAQs
                </Link>
                <Link href="/support" className="block text-blue-600 hover:underline">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
