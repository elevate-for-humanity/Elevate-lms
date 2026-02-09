import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  CheckCircle,
  Play,
  FileText,
  MessageSquare,
  Bell,
  ChevronRight,
  Target,
  Briefcase,
  Star,
  Flame,
  Trophy,
  BookOpen,
  Video,
  ClipboardCheck,
  BarChart3,
  HelpCircle,
  GraduationCap,
  Calendar,
  Award,
  Users,
  DollarSign,
} from 'lucide-react';
import { Leaderboard } from '@/components/Leaderboard';
import { Gamification } from '@/components/Gamification';
import { StudyGroups } from '@/components/StudyGroups';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NextActionBanner } from '@/components/enrollment/NextActionBanner';
import { OnboardingTour, dashboardTour } from '@/components/onboarding/OnboardingTour';
import { ComplianceGate } from '@/components/compliance/ComplianceGate';

function NextActionBannerWrapper() {
  return <NextActionBanner />;
}

export const metadata: Metadata = {
  title: 'Student Dashboard | Elevate LMS',
  description: 'Your learning dashboard - track progress, view courses, and manage your training.',
};

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  if (!supabase) { redirect('/login'); }
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login?redirect=/student/dashboard');
  }

  // Fetch all student data
  const [
    profileResult,
    enrollmentResult,
    hoursResult,
    achievementsResult,
    streakResult,
    pointsResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, phone, role')
      .eq('id', user.id)
      .single(),
    
    supabase
      .from('partner_lms_enrollments')
      .select(`
        *,
        partner_lms_courses (*),
        partner_lms_providers (*)
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('apprentice_hours_log')
      .select('*')
      .eq('student_id', user.id)
      .order('logged_date', { ascending: false })
      .limit(10),
    
    supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false }),
    
    supabase
      .from('daily_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    
    supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const enrollments = enrollmentResult.data || [];
  const hours = hoursResult.data || [];
  const achievements = achievementsResult.data || [];
  const streak = streakResult.data;
  const points = pointsResult.data;

  // Calculate hours
  const totalRtiMinutes = hours.filter(h => h.hour_type === 'RTI').reduce((sum, h) => sum + (h.minutes || 0), 0);
  const totalOjtMinutes = hours.filter(h => h.hour_type === 'OJT').reduce((sum, h) => sum + (h.minutes || 0), 0);
  const totalHours = (totalRtiMinutes + totalOjtMinutes) / 60;

  const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Student';
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('') || firstName[0].toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Onboarding Tour */}
      <OnboardingTour steps={dashboardTour} tourKey="student-dashboard" />
      
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student', href: '/student' }, { label: 'Dashboard' }]} />
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <Image src="/logo.png" alt="Elevate" width={32} height={32} className="rounded-lg sm:w-9 sm:h-9" />
              <div className="hidden sm:block">
                <p className="font-bold text-slate-900">Elevate LMS</p>
                <p className="text-xs text-slate-500">Student Portal</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/student/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/lms/courses" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
                <BookOpen className="w-4 h-4" />
                My Courses
              </Link>
              <Link href="/student/hours" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
                <Clock className="w-4 h-4" />
                Hours Log
              </Link>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              {points && (
                <div className="flex items-center gap-1 bg-yellow-50 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-full">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
                  <span className="text-xs sm:text-sm font-semibold text-yellow-700">{points.total_points?.toLocaleString() || 0}</span>
                </div>
              )}
              {streak && (
                <div className="hidden xs:flex items-center gap-1 bg-orange-50 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-full">
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                  <span className="text-xs sm:text-sm font-semibold text-orange-700">{streak.current_streak || 0}</span>
                </div>
              )}
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-700 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                {initials}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-slate-100 overflow-x-auto">
          <div className="flex px-3 py-2 gap-1 min-w-max">
            <Link href="/student/dashboard" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 whitespace-nowrap">
              <BarChart3 className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <Link href="/lms/courses" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap">
              <BookOpen className="w-3.5 h-3.5" />
              Courses
            </Link>
            <Link href="/student/hours" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5" />
              Hours
            </Link>
            <Link href="/student/certifications" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap">
              <Award className="w-3.5 h-3.5" />
              Certs
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Next Required Action Banner */}
        <NextActionBannerWrapper />

        {/* Welcome Banner */}
        <div className="bg-slate-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 truncate">Welcome back, {firstName}!</h1>
              <p className="text-blue-100 text-sm sm:text-base truncate">{profile?.email}</p>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-500/30">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">{enrollments.length}</p>
                <p className="text-[10px] sm:text-xs text-blue-200">Courses</p>
              </div>
              <div className="h-10 sm:h-12 w-px bg-blue-400/50" />
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">{Math.round(totalHours)}</p>
                <p className="text-[10px] sm:text-xs text-blue-200">Hours</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Active Enrollments */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Your Courses</h2>
              </div>
              
              {enrollments.length === 0 ? (
                <div className="p-8 text-center">
                  <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">You haven&apos;t enrolled in any courses yet.</p>
                  <Link href="/programs" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Browse Programs
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {enrollments.map((enrollment: any) => (
                    <div key={enrollment.id} className="p-3 sm:p-4 hover:bg-slate-50">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                            {enrollment.partner_lms_courses?.course_name || 'Course'}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 truncate">
                            {enrollment.partner_lms_providers?.provider_name || 'Provider'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                            <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 sm:py-2 rounded-full ${
                              enrollment.status === 'active' ? 'bg-green-50 text-green-700' :
                              enrollment.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {enrollment.status === 'active' && <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                              {enrollment.status === 'completed' && <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                              {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                            </span>
                            <span className="text-[10px] sm:text-xs text-slate-500">
                              {enrollment.progress_percentage || 0}%
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${enrollment.progress_percentage || 0}%` }}
                            />
                          </div>
                        </div>
                        <Link 
                          href={enrollment.partner_lms_courses?.enrollment_link || '#'}
                          target="_blank"
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 flex-shrink-0"
                        >
                          Continue
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hours Summary */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] sm:text-sm text-slate-500">Total</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900">{Math.round(totalHours)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] sm:text-sm text-slate-500">OJT</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900">{Math.round(totalOjtMinutes / 60)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Video className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] sm:text-sm text-slate-500">RTI</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900">{Math.round(totalRtiMinutes / 60)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Hours Log */}
            {hours.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="p-3 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Recent Training Hours</h3>
                  <Link href="/student/hours" className="text-xs sm:text-sm text-blue-600 font-medium hover:text-blue-700">
                    View All
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {hours.slice(0, 5).map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 sm:p-4 gap-2">
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                        <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${entry.hour_type === 'OJT' ? 'bg-green-500' : 'bg-blue-500'}`} />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-xs sm:text-base truncate">{entry.description || entry.hour_type}</p>
                          <p className="text-[10px] sm:text-sm text-slate-500">{entry.logged_date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <span className="font-semibold text-slate-900 text-xs sm:text-base">{Math.round((entry.minutes || 0) / 60)}h</span>
                        {entry.status === 'APPROVED' && (
                          <span className="hidden sm:flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        {entry.status === 'APPROVED' && (
                          <CheckCircle className="w-4 h-4 text-green-500 sm:hidden" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
              <h3 className="font-bold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Your Profile</h3>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-xs sm:text-sm text-slate-500">Name</p>
                  <p className="font-medium text-slate-900 text-sm sm:text-base truncate">{profile?.full_name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-500">Email</p>
                  <p className="font-medium text-slate-900 text-sm sm:text-base truncate">{profile?.email}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-500">Role</p>
                  <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 sm:py-2 rounded-full">
                    {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1) || 'Student'}
                  </span>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Achievements</h3>
                <span className="text-xs sm:text-sm text-slate-500">{achievements.length} earned</span>
              </div>
              {achievements.length === 0 ? (
                <div className="text-center py-3 sm:py-4">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-slate-500">Complete courses to earn achievements!</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {achievements.slice(0, 4).map((achievement: any) => (
                    <div key={achievement.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-yellow-50 rounded-lg">
                      <span className="text-xl sm:text-2xl">{achievement.icon || '🏆'}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-xs sm:text-base truncate">{achievement.label}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500 truncate">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
              <h3 className="font-bold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                <Link href="/student/hours/log" className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 text-left hover:bg-slate-50 rounded-lg transition">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-slate-900 text-xs sm:text-base">Log Hours</span>
                </Link>
                <Link href="/student/certifications" className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 text-left hover:bg-slate-50 rounded-lg transition">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-slate-900 text-xs sm:text-base">Certifications</span>
                </Link>
                <Link href="/student/billing" className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 text-left hover:bg-slate-50 rounded-lg transition">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-slate-900 text-xs sm:text-base">Billing</span>
                </Link>
                <Link href="/student/support" className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 text-left hover:bg-slate-50 rounded-lg transition">
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
                  <span className="font-medium text-slate-900 text-xs sm:text-base">Get Help</span>
                </Link>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Top Learners</h3>
                <Link href="/student/leaderboard" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700">
                  View All
                </Link>
              </div>
              <Leaderboard />
            </div>
          </div>
        </div>

        {/* Community Section */}
        <div className="mt-6 sm:mt-8 grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Gamification */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Your Progress</h3>
            </div>
            <Gamification />
          </div>

          {/* Study Groups */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Study Groups</h3>
              </div>
              <Link href="/community/groups" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700">
                Browse All
              </Link>
            </div>
            <StudyGroups />
          </div>
        </div>
      </main>
    </div>
  );
}
