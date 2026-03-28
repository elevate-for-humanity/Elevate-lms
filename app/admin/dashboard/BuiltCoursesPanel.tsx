import Link from 'next/link';
import { getAdminCoursesOverview, type AdminCourseOverview } from '@/lib/admin/course-admin-overview';

export async function BuiltCoursesPanel() {
  let courses: Awaited<ReturnType<typeof getAdminCoursesOverview>> = [];
  try {
    courses = await getAdminCoursesOverview();
  } catch {
    // Non-fatal: panel is informational only
    courses = [];
  }
  const built = courses.filter(c => c.actualLessons > 0).slice(0, 5);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Built Courses</h2>
          <p className="text-xs text-slate-500">Courses with live lesson content.</p>
        </div>
        <Link href="/admin/courses" className="text-xs font-medium text-brand-blue-600 hover:underline">
          View all
        </Link>
      </div>

      <div className="space-y-2">
        {built.map(course => (
          <div key={course.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{course.title}</p>
              <p className="text-xs text-slate-400">
                {course.actualLessons} lessons
                {course.expectedLessons > 0 && ` / ${course.expectedLessons} expected`}
              </p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0 ml-3">
              <Link
                href={`/admin/courses/${course.id}/inspect`}
                className="rounded border px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Inspect
              </Link>
              <Link
                href={`/lms/courses/${course.id}`}
                className="rounded border px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                LMS
              </Link>
            </div>
          </div>
        ))}

        {built.length === 0 && (
          <p className="text-sm text-slate-400 py-2">No courses with lesson content yet.</p>
        )}
      </div>
    </div>
  );
}
