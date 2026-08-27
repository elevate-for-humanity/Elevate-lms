import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, CalendarDays } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CalendarWidget } from '@/components/CalendarWidget';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const metadata: Metadata = {
  title: 'My Calendar | Student Portal',
  description: 'View your class schedule, assignments, exams, and important dates.',
};

export const dynamic = 'force-dynamic';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  let upcomingAssignments: Array<{
    id: string;
    title: string;
    due_date: string;
    course_id: string | null;
    courseTitle?: string;
  }> = [];

  try {
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('course_id')
      .eq('student_id', user.id)
      .in('status', ['active', 'enrolled', 'in_progress', 'completed']);

    if (enrollmentError) throw enrollmentError;

    const courseIds = [...new Set((enrollments ?? []).map((row) => row.course_id).filter(Boolean))] as string[];

    if (courseIds.length > 0) {
      const [{ data: assignments, error: assignmentsError }, { data: courses, error: coursesError }] =
        await Promise.all([
          supabase
            .from('assignments')
            .select('id, title, due_date, course_id')
            .in('course_id', courseIds)
            .gte('due_date', new Date().toISOString())
            .order('due_date', { ascending: true })
            .limit(8),
          supabase.from('courses').select('id, title').in('id', courseIds),
        ]);

      if (assignmentsError) throw assignmentsError;
      if (coursesError) throw coursesError;

      const courseTitles = new Map((courses ?? []).map((course) => [String(course.id), String(course.title)]));
      upcomingAssignments = (assignments ?? []).map((assignment) => {
        const courseTitle = assignment.course_id
          ? courseTitles.get(String(assignment.course_id))
          : undefined;
        return {
          id: String(assignment.id),
          title: String(assignment.title),
          due_date: String(assignment.due_date),
          course_id: assignment.course_id ? String(assignment.course_id) : null,
          ...(courseTitle ? { courseTitle } : {}),
        };
      });
    }
  } catch (error) {
    logger.error('[calendar] canonical assignment load failed', error);
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <Breadcrumbs items={[{ label: 'My Programs', href: '/lms/courses' }, { label: 'Calendar' }]} />

        <header className="mb-8 mt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-950">My Calendar</h1>
              <p className="mt-1 text-slate-700">Classes, deadlines, assignments, and scheduled events in one place.</p>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <CalendarWidget userId={user.id} />

          <aside className="space-y-6" aria-label="Calendar details">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                <BookOpen className="h-5 w-5 text-orange-700" aria-hidden="true" />
                Upcoming assignments
              </h2>

              {upcomingAssignments.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {upcomingAssignments.map((assignment) => (
                    <li key={assignment.id}>
                      <Link
                        href={`/lms/assignments/${assignment.id}`}
                        className="block rounded-lg border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-700"
                      >
                        <p className="font-semibold text-slate-950">{assignment.title}</p>
                        {assignment.courseTitle ? (
                          <p className="mt-1 text-sm text-slate-600">{assignment.courseTitle}</p>
                        ) : null}
                        <p className="mt-1 text-sm font-medium text-orange-800">Due {formatDate(assignment.due_date)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-600">No upcoming assignments are scheduled for your enrolled courses.</p>
              )}
            </section>

            <section className="rounded-xl bg-slate-950 p-6 text-white">
              <h2 className="text-lg font-bold">Course tools</h2>
              <div className="mt-4 grid gap-2">
                <Link href="/lms/assignments" className="rounded-lg bg-white/10 px-4 py-3 text-center font-semibold hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white">View all assignments</Link>
                <Link href="/lms/grades" className="rounded-lg bg-white/10 px-4 py-3 text-center font-semibold hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white">Check grades</Link>
                <Link href="/lms/support" className="rounded-lg bg-white/10 px-4 py-3 text-center font-semibold hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white">Get help</Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
