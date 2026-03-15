import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'My Calendar | Elevate For Humanity',
  description: 'View your personal schedule, enrolled classes, and important dates.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/calendar',
  },
};

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  let enrollments = null;
  let assignments = null;

  if (user) {
    const { data: enrollmentData } = await db
      .from('program_enrollments')
      .select(`
        id,
        course:courses(id, title, schedule, start_date, end_date)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');
    enrollments = enrollmentData;

    const courseIds = enrollments?.map((e: any) => e.course?.id).filter(Boolean) || [];
    if (courseIds.length > 0) {
      const { data: assignmentData } = await db
        .from('assignments')
        .select('*')
        .in('course_id', courseIds)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(10);
      assignments = assignmentData;
    }
  }

  const { data: programs } = await db
    .from('programs')
    .select('id, name, start_date, schedule')
    .eq('is_active', true)
    .limit(10);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Calendar' }]} />
        </div>
      </div>

      {/* Hero with image */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/images/pages/calendar-hero.jpg" alt="Calendar and Schedule" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">My Calendar</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">Your personal schedule and important dates</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!user && (
          <div className="bg-white rounded-xl overflow-hidden shadow-lg mb-8">
            <div className="relative h-32 overflow-hidden">
              <Image src="/images/pages/calendar-page-1.jpg" alt="Sign in" fill sizes="100vw" className="object-cover" />
            </div>
            <div className="p-6 text-center">
              <h2 className="text-lg font-semibold text-brand-blue-900 mb-2">Sign in to see your schedule</h2>
              <p className="text-brand-blue-700 mb-4">View your enrolled classes, assignments, and deadlines.</p>
              <Link href="/login?redirect=/calendar" className="inline-block bg-brand-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-blue-700">
                Sign In
              </Link>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {user && (
              <>
                <div>
                  <h2 className="text-xl font-semibold mb-4">My Classes</h2>
                  <div className="space-y-3">
                    {enrollments && enrollments.length > 0 ? enrollments.map((enrollment: any) => (
                      <div key={enrollment.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="flex items-stretch">
                          <div className="relative w-24 flex-shrink-0">
                            <Image src="/images/pages/calendar-page-1.jpg" alt={enrollment.course?.title || 'Course'} fill sizes="100vw" className="object-cover" />
                          </div>
                          <div className="flex-1 p-4">
                            <h3 className="font-semibold">{enrollment.course?.title}</h3>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {enrollment.course?.schedule || 'See course details'}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 flex items-center">
                            <Link href={`/courses/${enrollment.course?.id}`} className="text-brand-blue-600 text-sm font-medium hover:underline">
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="relative h-32 overflow-hidden">
                          <Image src="/images/pages/calendar-page-1.jpg" alt="Browse programs" fill sizes="100vw" className="object-cover" />
                        </div>
                        <div className="p-6 text-center text-gray-500">
                          <p>No enrolled classes</p>
                          <Link href="/programs" className="text-brand-blue-600 font-medium hover:underline">Browse Programs</Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Upcoming Deadlines</h2>
                  <div className="space-y-3">
                    {assignments && assignments.length > 0 ? assignments.map((assignment: any) => (
                      <div key={assignment.id} className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{assignment.title}</h3>
                            <p className="text-sm text-gray-500">{assignment.course_title}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-brand-orange-600">
                              {new Date(assignment.due_date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">Due</div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-gray-500">
                        No upcoming deadlines
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Program Schedules</h2>
            <div className="space-y-3">
              {programs && programs.length > 0 ? programs.map((program: any) => (
                <Link key={program.id} href={`/programs/${program.id}`} className="block bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition">
                  <h3 className="font-semibold text-gray-900">{program.name}</h3>
                  {program.schedule && <p className="text-sm text-gray-600 mt-1">{program.schedule}</p>}
                  {program.start_date && (
                    <p className="text-xs text-brand-blue-600 mt-2">
                      Starts: {new Date(program.start_date).toLocaleDateString()}
                    </p>
                  )}
                </Link>
              )) : (
                <div className="bg-white rounded-lg shadow-sm border p-4 text-center text-gray-500">
                  No active programs
                </div>
              )}
            </div>

            <div className="mt-6">
              <Link href="/events" className="block bg-white rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition">
                <div className="relative h-24 overflow-hidden">
                  <Image src="/images/pages/calendar-page-1.jpg" alt="Events" fill sizes="100vw" className="object-cover" />
                </div>
                <div className="p-4 text-center">
                  <span className="font-medium text-brand-blue-700">View Public Events</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
