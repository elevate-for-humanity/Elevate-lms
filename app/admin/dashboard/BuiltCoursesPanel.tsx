import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getAdminCoursesOverview } from '@/lib/admin/course-admin-overview';

export async function BuiltCoursesPanel() {
  let courses: Awaited<ReturnType<typeof getAdminCoursesOverview>> = [];
  try {
    courses = await getAdminCoursesOverview();
  } catch {
    courses = [];
  }
  const built = courses.filter(c => c.actualLessons > 0).slice(0, 8);

  return (
    <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mb-28">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Live content</p>
          <h2 className="text-5xl font-black text-slate-900 leading-none">Courses</h2>
        </div>
        <Link href="/admin/courses" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5">
          All courses <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {built.length === 0 ? (
        <p className="text-slate-500 text-sm py-10">No courses with lesson content yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {built.map(course => {
            const pct = course.expectedLessons > 0
              ? Math.round((course.actualLessons / course.expectedLessons) * 100)
              : 100;
            return (
              <div key={course.id} className="flex items-center gap-6 py-6">
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-slate-900 truncate mb-2">{course.title}</p>
                  <div className="flex items-center gap-6 text-sm mb-3">
                    <span className="text-slate-500 tabular-nums">{course.actualLessons} lessons</span>
                    {course.expectedLessons > 0 && (
                      <span className="text-slate-400 tabular-nums">of {course.expectedLessons} expected</span>
                    )}
                    <span className="font-bold text-emerald-600 tabular-nums">{pct}% built</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-sm">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link
                    href={`/admin/courses/${course.id}/inspect`}
                    className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Inspect
                  </Link>
                  <Link
                    href={`/lms/courses/${course.id}`}
                    className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    View in LMS
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
