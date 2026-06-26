import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Clock, Award, TrendingUp, Calendar, ChevronRight, Play } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | Student Portal | Elevate For Humanity',
  description: 'Your learning dashboard.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/portal/student/dashboard');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch student's enrollments with program details
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      progress,
      enrolled_at,
      started_at,
      program:programs(id, name, slug, duration_weeks, total_hours, cover_image_url)
    `)
    .eq('student_id', user.id)
    .order('enrolled_at', { ascending: false });

  // Fetch recent lesson progress
  const { data: recentProgress } = await supabase
    .from('lesson_progress')
    .select(`
      id,
      completed_at,
      time_spent_minutes,
      lesson:lessons(id, title, module:modules(title))
    `)
    .eq('enrollment_id', enrollments?.[0]?.id)
    .order('completed_at', { ascending: false })
    .limit(5);

  // Fetch certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('id, certificate_number, issued_at, program:programs(name)')
    .eq('student_id', user.id)
    .eq('status', 'issued');

  // Calculate stats
  const activeEnrollment = enrollments?.find(e => e.status === 'active');
  const totalHoursLogged = recentProgress?.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) || 0;
  const completedLessons = recentProgress?.filter(p => p.completed_at).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
            <Breadcrumbs items={[{ label: "Portal", href: "/portal" }, { label: "Student", href: "/portal/student/dashboard" }, { label: "Dashboard" }]} />
{/* Header */}
      <div className="bg-orange-500 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Welcome back, {profile?.first_name || profile?.full_name || 'Student'}!</h1>
          <p className="text-orange-100 mt-1">Continue your learning journey</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <BookOpen className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{enrollments?.length || 0}</p>
            <p className="text-gray-600 text-sm">Enrolled Programs</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{activeEnrollment?.progress || 0}%</p>
            <p className="text-gray-600 text-sm">Current Progress</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <Clock className="w-8 h-8 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{Math.round(totalHoursLogged / 60)}</p>
            <p className="text-gray-600 text-sm">Hours Logged</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <Award className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{certificates?.length || 0}</p>
            <p className="text-gray-600 text-sm">Certificates Earned</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Current Program */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Your Programs</h2>
            {enrollments && enrollments.length > 0 ? (
              <div className="space-y-4">
                {enrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="bg-white rounded-xl border p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-8 h-8 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{enrollment.program?.name}</h3>
                            <p className="text-sm text-gray-500">
                              {enrollment.program?.duration_weeks} weeks • {enrollment.program?.total_hours} hours
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            enrollment.status === 'active' ? 'bg-green-100 text-green-700' :
                            enrollment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {enrollment.status}
                          </span>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{enrollment.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full transition-all" 
                              style={{ width: `${enrollment.progress || 0}%` }} />
                          </div>
                        </div>
                        {enrollment.status === 'active' && (
                          <Link href={`/lms/courses/${enrollment.program?.slug}`}
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                            <Play className="w-4 h-4" /> Continue Learning
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-900">No programs yet</p>
                <p className="text-sm text-gray-500 mb-4">Browse our catalog to get started</p>
                <Link href="/programs" className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  Browse Programs
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              {recentProgress && recentProgress.length > 0 ? (
                <div className="space-y-3">
                  {recentProgress.map((progress: any) => (
                    <div key={progress.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                      <div>
                        <p className="font-medium">{progress.lesson?.title}</p>
                        <p className="text-gray-500">{progress.lesson?.module?.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>

            {/* Certificates */}
            {certificates && certificates.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold mb-4">Your Certificates</h3>
                <div className="space-y-3">
                  {certificates.map((cert: any) => (
                    <Link key={cert.id} href={`/certificates/${cert.certificate_number}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <Award className="w-8 h-8 text-orange-500" />
                      <div>
                        <p className="font-medium text-sm">{cert.program?.name}</p>
                        <p className="text-xs text-gray-500">
                          Issued {new Date(cert.issued_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/portal/student/profile" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm">My Profile</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link href="/portal/student/notifications" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm">Notifications</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                <Link href="/student-support" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm">Get Support</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
