import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

async function getStudentDashboardData() {
  const supabase = createAdminClient();
  if (!supabase) return { enrollments: [], courses: [], programs: [] };

  const [enrollRes, courseRes, programRes] = await Promise.all([
    supabase.from('enrollments').select('id, user_id, course_id, status, progress, enrolled_at').order('enrolled_at', { ascending: false }).limit(50),
    supabase.from('courses').select('id, title, course_code, description, duration_hours, price, is_active').eq('is_active', true).order('title').limit(20),
    supabase.from('programs').select('id, name, slug, category, status, image_url, total_cost').eq('is_active', true).order('name').limit(20),
  ]);

  return {
    enrollments: enrollRes.data || [],
    courses: courseRes.data || [],
    programs: programRes.data || [],
  };
}

export default async function StudentPWAPage() {
  const { enrollments, courses, programs } = await getStudentDashboardData();

  const activeEnrollments = enrollments.filter((e: any) => e.status === 'active' || e.status === 'enrolled');
  const completedEnrollments = enrollments.filter((e: any) => e.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative h-48 sm:h-56">
        <Image src="/images/programs-hq/students-learning.jpg" alt="Students in classroom" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-blue-900/80 to-brand-blue-900/95" />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <Image src="/logo.png" alt="Elevate" width={40} height={40} className="mb-3" />
          <h1 className="text-2xl font-bold text-white">My Learning Dashboard</h1>
          <p className="text-blue-200 text-sm mt-1">Track courses, progress, and credentials</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-brand-blue-600">{activeEnrollments.length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-brand-green-600">{completedEnrollments.length}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{courses.length}</div>
          <div className="text-xs text-slate-500">Courses</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/lms/dashboard" className="bg-brand-blue-600 text-white rounded-xl p-4 text-center font-semibold text-sm hover:bg-brand-blue-700">
            Go to LMS →
          </Link>
          <Link href="/apply" className="bg-brand-red-600 text-white rounded-xl p-4 text-center font-semibold text-sm hover:bg-brand-red-700">
            Apply Now →
          </Link>
          <Link href="/programs" className="bg-white border border-slate-200 text-slate-900 rounded-xl p-4 text-center font-semibold text-sm hover:bg-slate-50">
            Browse Programs
          </Link>
          <Link href="/funding" className="bg-white border border-slate-200 text-slate-900 rounded-xl p-4 text-center font-semibold text-sm hover:bg-slate-50">
            Funding Options
          </Link>
        </div>
      </div>

      {/* Available Courses */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Available Courses ({courses.length})</h2>
        <div className="space-y-2">
          {courses.slice(0, 8).map((course: any) => (
            <Link key={course.id} href={`/lms/courses/${course.id}`} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3 hover:border-brand-blue-300">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center text-brand-blue-600 font-bold text-xs flex-shrink-0">
                {course.course_code?.slice(0, 3) || 'CRS'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm truncate">{course.title}</div>
                <div className="text-xs text-slate-500">{course.duration_hours ? `${course.duration_hours} hrs` : 'Self-paced'} {course.price ? `· $${course.price}` : '· Free'}</div>
              </div>
              <span className="text-slate-400 text-sm">→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Programs */}
      <div className="px-4 mt-6 pb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Programs ({programs.length})</h2>
        <div className="grid grid-cols-2 gap-3">
          {programs.slice(0, 6).map((prog: any) => (
            <Link key={prog.id} href={`/programs/${prog.slug}`} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-24">
                <Image src={prog.image_url || '/images/programs-hq/training-classroom.jpg'} alt={prog.name} fill className="object-cover" />
              </div>
              <div className="p-3">
                <div className="font-semibold text-slate-900 text-xs truncate">{prog.name}</div>
                <div className="text-xs text-slate-500">{prog.category}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
