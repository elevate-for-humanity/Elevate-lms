// ProLingo-style LMS Dashboard - clean, educational, minimal
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AvatarVideoOverlay from '@/components/AvatarVideoOverlay';
import {
  BookOpen, Play, Award, Bell, Settings, ChevronRight, CheckCircle,
  Target, Calendar, MessageSquare, BarChart3, Clock,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import EnhancedDashboard from '@/components/EnhancedDashboard';
import ReferralDashboard from '@/components/ReferralDashboard';

export const metadata: Metadata = {
  title: 'Learning Dashboard | Elevate for Humanity',
  description: 'Access your courses, track progress, and continue learning.',
};

export const dynamic = 'force-dynamic';

interface Course { id: string; title: string; description: string | null; thumbnail_url: string | null; duration_hours: number | null; lesson_count: number | null; }
interface Enrollment { id: string; progress: number | null; status: string; enrolled_at: string; last_accessed: string | null; course: Course | null; }
interface Lesson { title: string; course_id: string; }
interface Activity { id: string; completed_at: string; lesson: Lesson | null; }
interface Assignment { id: string; title: string; course_title: string; due_date: string; course_id: string; }
interface Certificate { id: string; title: string; issued_at: string; }
interface Profile { id: string; full_name: string | null; }

export default async function LMSPage() {
  const supabase = await createClient();
  if (!supabase) { redirect("/login"); }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect('/login?redirect=/lms'); }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const typedProfile = profile as Profile | null;

  const { data: courseEnrollments } = await supabase
    .from('enrollments')
    .select(`id, progress, status, enrolled_at, last_accessed, course:courses(id, title, description, thumbnail_url, duration_hours, lesson_count)`)
    .eq('user_id', user.id)
    .order('last_accessed', { ascending: false });

  const { data: programEnrollments } = await supabase
    .from('program_enrollments')
    .select(`id, status, created_at, program:programs(id, name, description, slug, duration_weeks)`)
    .eq('student_id', user.id)
    .in('status', ['IN_PROGRESS', 'active']);

  const { data: studentEnrollments } = await supabase
    .from('student_enrollments')
    .select(`id, status, started_at, program_slug`)
    .eq('student_id', user.id)
    .eq('status', 'active');

  const typedEnrollments = (courseEnrollments || []) as Enrollment[];
  const typedProgramEnrollments = programEnrollments || [];
  const typedStudentEnrollments = studentEnrollments || [];

  const { data: recentActivity } = await supabase
    .from('lesson_progress')
    .select(`id, completed_at, lesson:lessons(title, course_id)`)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(5);
  const typedActivity = (recentActivity || []) as Activity[];

  const courseIds = typedEnrollments.map(e => e.course?.id).filter(Boolean) as string[];
  const { data: assignments } = courseIds.length > 0 
    ? await supabase.from('assignments').select('*').in('course_id', courseIds).gte('due_date', new Date().toISOString()).order('due_date', { ascending: true }).limit(5)
    : { data: [] };
  const typedAssignments = (assignments || []) as Assignment[];

  const { data: certificates } = await supabase.from('certificates').select('*').eq('user_id', user.id).order('issued_at', { ascending: false }).limit(3);
  const typedCertificates = (certificates || []) as Certificate[];

  const { count: notificationCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);

  const totalProgress = typedEnrollments.length ? Math.round(typedEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / typedEnrollments.length) : 0;
  const completedCourses = typedEnrollments.filter(e => e.progress === 100).length;
  const continueCourse = typedEnrollments.find(e => (e.progress || 0) > 0 && (e.progress || 0) < 100);

  return (
    <div className="min-h-screen bg-brand-blue-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'LMS' }]} />
        </div>
      </div>

      {/* Avatar Guide */}
      <AvatarVideoOverlay videoSrc="/videos/avatars/ai-tutor.mp4" avatarName="AI Tutor" position="bottom-right" autoPlay={true} showOnLoad={true} />
      
      {/* Header - ProLingo style */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-blue-600 font-semibold text-sm uppercase tracking-wide">Learning Dashboard</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Welcome back, {typedProfile?.full_name || 'Learner'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/lms/notifications" className="relative p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                <Bell className="w-5 h-5 text-slate-600" />
                {notificationCount && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>
              <Link href="/lms/settings" className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                <Settings className="w-5 h-5 text-slate-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats - ProLingo style centered */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mb-12">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold text-brand-blue-600">{typedEnrollments.length}</div>
            <div className="text-sm text-slate-500 mt-1">Courses Enrolled</div>
          </div>
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold text-green-600">{completedCourses}</div>
            <div className="text-sm text-slate-500 mt-1">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold text-yellow-600">{typedCertificates.length}</div>
            <div className="text-sm text-slate-500 mt-1">Certificates</div>
          </div>
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold text-red-600">{totalProgress}%</div>
            <div className="text-sm text-slate-500 mt-1">Overall Progress</div>
          </div>
        </div>

        {/* Continue Learning - ProLingo style card */}
        {continueCourse && (
          <div className="bg-white rounded-3xl shadow-sm border p-6 sm:p-8 mb-8">
            <p className="text-brand-blue-600 font-semibold text-sm uppercase tracking-wide mb-4">Continue Learning</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="w-full sm:w-48 h-32 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 relative">
                {continueCourse.course?.thumbnail_url ? (
                  <Image src={continueCourse.course.thumbnail_url} alt={continueCourse.course.title || 'Course thumbnail'} fill className="object-cover" sizes="192px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-10 h-10 text-slate-300" /></div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{continueCourse.course?.title}</h2>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 max-w-xs h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-blue-600 rounded-full" style={{ width: `${continueCourse.progress}%` }} />
                  </div>
                  <span className="text-sm font-medium text-slate-600">{continueCourse.progress}% complete</span>
                </div>
                <Link href={`/lms/courses/${continueCourse.course?.id}`} className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-blue-700 transition">
                  <Play className="w-4 h-4" /> Continue Course
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Courses - ProLingo style */}
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">My Courses</h2>
                <Link href="/lms/courses" className="text-brand-blue-600 text-sm font-semibold hover:underline">View All →</Link>
              </div>
              {typedEnrollments.length > 0 ? (
                <div className="space-y-4">
                  {typedEnrollments.slice(0, 4).map((enrollment) => (
                    <Link key={enrollment.id} href={`/lms/courses/${enrollment.course?.id}`} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition group">
                      <div className="w-16 h-12 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0 relative">
                        {enrollment.course?.thumbnail_url ? (
                          <Image src={enrollment.course.thumbnail_url} alt={enrollment.course.title || 'Course thumbnail'} fill className="object-cover" sizes="64px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 text-slate-400" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate group-hover:text-brand-blue-600 transition">{enrollment.course?.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex-1 max-w-[120px] h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-blue-600 rounded-full" style={{ width: `${enrollment.progress || 0}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{enrollment.progress || 0}%</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-blue-600 transition" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-4">No courses enrolled yet</p>
                  <Link href="/programs" className="text-brand-blue-600 font-semibold hover:underline">Browse Programs →</Link>
                </div>
              )}
            </div>

            {/* Program Enrollments */}
            {(typedProgramEnrollments.length > 0 || typedStudentEnrollments.length > 0) && (
              <div className="bg-white rounded-3xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">My Programs</h2>
                  <Link href="/student/dashboard" className="text-brand-blue-600 text-sm font-semibold hover:underline">View Dashboard →</Link>
                </div>
                <div className="space-y-4">
                  {typedProgramEnrollments.map((enrollment: any) => (
                    <Link key={enrollment.id} href={`/programs/${enrollment.program?.slug || enrollment.program?.id}`} className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl hover:bg-green-100 transition">
                      <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center"><Award className="w-6 h-6 text-green-700" /></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{enrollment.program?.name || 'Program'}</h3>
                        <p className="text-sm text-slate-500">{enrollment.status === 'IN_PROGRESS' ? 'In Progress' : enrollment.status}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded-full">Workforce</span>
                    </Link>
                  ))}
                  {typedStudentEnrollments.map((enrollment: any) => (
                    <Link key={enrollment.id} href="/apprentice" className="flex items-center gap-4 p-4 bg-brand-blue-50 rounded-2xl hover:bg-brand-blue-100 transition">
                      <div className="w-12 h-12 bg-brand-blue-200 rounded-xl flex items-center justify-center"><Award className="w-6 h-6 text-brand-blue-700" /></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{enrollment.program_slug || 'Apprenticeship'}</h3>
                        <p className="text-sm text-slate-500">Active Apprenticeship</p>
                      </div>
                      <span className="px-3 py-1 bg-brand-blue-200 text-brand-blue-800 text-xs font-semibold rounded-full">Apprentice</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Assignments */}
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Upcoming Assignments</h2>
                <Link href="/lms/assignments" className="text-brand-blue-600 text-sm font-semibold hover:underline">View All →</Link>
              </div>
              {typedAssignments.length > 0 ? (
                <div className="space-y-3">
                  {typedAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
                        <p className="text-sm text-slate-500">{assignment.course_title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">{new Date(assignment.due_date).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-500">Due</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400" />
                  <p className="text-slate-500">No upcoming assignments</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
              {typedActivity.length > 0 ? (
                <div className="space-y-4">
                  {typedActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{activity.lesson?.title}</p>
                        <p className="text-xs text-slate-500">{new Date(activity.completed_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No recent activity</p>
              )}
            </div>

            {/* Certificates */}
            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Certificates</h2>
                <Link href="/lms/certificates" className="text-brand-blue-600 text-sm font-semibold hover:underline">View All</Link>
              </div>
              {typedCertificates.length > 0 ? (
                <div className="space-y-3">
                  {typedCertificates.map((cert) => (
                    <div key={cert.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
                      <Award className="w-6 h-6 text-yellow-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{cert.title}</p>
                        <p className="text-xs text-slate-500">{new Date(cert.issued_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Award className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-500">Complete courses to earn certificates</p>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-brand-blue-50 rounded-3xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link href="/lms/schedule" className="flex items-center gap-3 text-slate-700 hover:text-brand-blue-600 transition">
                  <Calendar className="w-5 h-5" /> <span className="text-sm font-medium">Class Schedule</span>
                </Link>
                <Link href="/lms/messages" className="flex items-center gap-3 text-slate-700 hover:text-brand-blue-600 transition">
                  <MessageSquare className="w-5 h-5" /> <span className="text-sm font-medium">Messages</span>
                </Link>
                <Link href="/lms/analytics" className="flex items-center gap-3 text-slate-700 hover:text-brand-blue-600 transition">
                  <BarChart3 className="w-5 h-5" /> <span className="text-sm font-medium">Learning Analytics</span>
                </Link>
                <Link href="/support" className="flex items-center gap-3 text-slate-700 hover:text-brand-blue-600 transition">
                  <Clock className="w-5 h-5" /> <span className="text-sm font-medium">Get Help</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Enhanced Dashboard */}
          <div className="mt-8">
            <EnhancedDashboard role={profile?.role || 'student'} userId={user.id} />
          </div>

          {/* Referral Dashboard */}
          <div className="mt-8">
            <ReferralDashboard userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
