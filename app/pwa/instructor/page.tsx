import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

async function getInstructorData() {
  const supabase = createAdminClient();
  if (!supabase) return { courses: [], totalEnrollments: 0, activeEnrollments: 0 };

  const [courseRes, totalRes, activeRes] = await Promise.all([
    supabase.from('courses').select('id, title, course_code, description, duration_hours, is_active, instructor_id').eq('is_active', true).order('title').limit(30),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  return {
    courses: courseRes.data || [],
    totalEnrollments: totalRes.count || 0,
    activeEnrollments: activeRes.count || 0,
  };
}

export default async function InstructorPWAPage() {
  const { courses, totalEnrollments, activeEnrollments } = await getInstructorData();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative h-48 sm:h-56">
        <Image src="/images/pages/demo-page-4.jpg" alt="Instructor in classroom" fill className="object-cover" priority />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <Image src="/logo.png" alt="Elevate" width={40} height={40} className="mb-3" />
          <h1 className="text-2xl font-bold text-white">Instructor Dashboard</h1>
          <p className="text-purple-200 text-sm mt-1">Manage courses, students, and grading</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{courses.length}</div>
          <div className="text-xs text-slate-500">Courses</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-brand-blue-600">{activeEnrollments}</div>
          <div className="text-xs text-slate-500">Active Students</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-brand-green-600">{totalEnrollments}</div>
          <div className="text-xs text-slate-500">Total Enrolled</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/instructor/dashboard" className="bg-purple-600 text-white rounded-xl p-4 text-center font-semibold text-sm hover:bg-purple-700">
            Full Dashboard →
          </Link>
          <Link href="/instructor/courses" className="bg-brand-blue-600 text-white rounded-xl p-4 text-center font-semibold text-sm hover:bg-brand-blue-700">
            My Courses →
          </Link>
          <Link href="/instructor/students" className="bg-white border border-slate-200 text-slate-900 rounded-xl p-4 text-center font-semibold text-sm hover:bg-slate-50">
            Student Roster
          </Link>
          <Link href="/pwa/instructor" className="bg-white border border-slate-200 text-slate-900 rounded-xl p-4 text-center font-semibold text-sm hover:bg-slate-50">
            Grading
          </Link>
        </div>
      </div>

      {/* Course List */}
      <div className="px-4 mt-6 pb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Active Courses ({courses.length})</h2>
        <div className="space-y-2">
          {courses.slice(0, 12).map((course: any) => (
            <Link key={course.id} href={`/instructor/courses/${course.id}`} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3 hover:border-purple-300">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0">
                {course.course_code?.slice(0, 4) || 'CRS'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm truncate">{course.title}</div>
                <div className="text-xs text-slate-500">{course.duration_hours ? `${course.duration_hours} hrs` : 'Self-paced'}</div>
              </div>
              <span className="text-slate-400 text-sm">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
