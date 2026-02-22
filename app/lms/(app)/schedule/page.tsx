export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/schedule',
  },
  title: 'Schedule | LMS | Elevate For Humanity',
  description: 'View your learning schedule and upcoming events.',
};

export default async function SchedulePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Schedule" }]} />
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
    redirect('/login?next=/lms/schedule');
  }

  // Get user's enrollments for schedule
  const { data: enrollments } = await db
    .from('program_enrollments')
    .select(
      `
      *,
      courses (
        id,
        title,
        description
      )
    `
    )
    .eq('user_id', user.id)
    .eq('status', 'active');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Schedule" }]} />
        </div>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Schedule</h1>
            <Link
              href="/lms/calendar"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              View Calendar
            </Link>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Today</h2>
            {enrollments && enrollments.length > 0 ? (
              <div className="space-y-4">
                {enrollments.slice(0, 3).map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {enrollment.courses?.title || 'Course'}
                      </p>
                      <p className="text-sm text-gray-600">Continue learning</p>
                    </div>
                    <Link
                      href={`/lms/courses/${enrollment.course_id}`}
                      className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                    >
                      Resume →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                No scheduled activities for today.{' '}
                <Link href="/lms/courses" className="text-brand-blue-600">
                  Browse courses
                </Link>
              </p>
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Deadlines</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="font-medium">Assignment Due</p>
                  <p className="text-sm text-gray-600">
                    Check your assignments for upcoming deadlines
                  </p>
                </div>
                <Link
                  href="/lms/assignments"
                  className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                >
                  View →
                </Link>
              </div>
            </div>
          </div>

          {/* Weekly Overview */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">This Week</h2>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">{day}</p>
                  <div className="h-20 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-400">-</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Your scheduled activities will appear here.{' '}
              <Link href="/lms/calendar" className="text-brand-blue-600">
                Open full calendar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
