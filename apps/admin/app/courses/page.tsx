import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Plus, Search, MoreVertical, AlertCircle } from 'lucide-react';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Courses | Elevate Admin',
  description: 'Manage training programs and courses in the Elevate LMS.',
};

interface ProgramCourse {
  id: string;
  title: string | null;
  name: string | null;
  status: string | null;
  is_active: boolean | null;
  is_published: boolean | null;
  total_hours: number | null;
  student_count: number;
  category: string | null;
}

export default async function CoursesPage() {
  const db = await requireAdminClient();

  const [{ data: programs, error: programsError }, { data: enrollments }] = await Promise.all([
    db.from('programs').select('id, title, name, status, is_active, is_published, total_hours').order('created_at', { ascending: false }).limit(100),
    db.from('program_enrollments').select('program_id', { count: 'exact', head: true }),
  ]);

  if (programsError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Failed to load courses: {programsError.message}</p>
        </div>
      </div>
    );
  }

  const enrollmentMap: Record<string, number> = {};
  for (const e of enrollments ?? []) {
    if (e && typeof e === 'object' && 'program_id' in e) {
      const pid = (e as any).program_id;
      enrollmentMap[pid] = (enrollmentMap[pid] ?? 0) + 1;
    }
  }

  const courses: ProgramCourse[] = (programs ?? []).map((p) => ({
    ...p,
    student_count: enrollmentMap[p.id] ?? 0,
    category: (p as any).category ?? (p as any).program_category ?? null,
  }));

  const activeCourses = courses.filter((c) => c.is_active || c.status === 'active').length;
  const totalStudents = courses.reduce((sum, c) => sum + c.student_count, 0);

  const getStatusBadge = (course: ProgramCourse) => {
    if (course.is_published) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>;
    }
    if (course.is_active) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Draft</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Inactive</span>;
  };

  const getHoursDisplay = (course: ProgramCourse) => {
    if (course.total_hours) return course.total_hours + ' hrs';
    return '—';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
              <p className="text-sm text-slate-500 mt-1">
                {courses.length} programs · {activeCourses} active · {totalStudents} total students
              </p>
            </div>
            <Link href="/studio/courses/create"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Course
            </Link>
          </div>
        </div>
      </section>

      <section className="py-4 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search courses..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
            </div>
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option>All Programs</option>
              <option>Healthcare</option>
              <option>Skilled Trades</option>
              <option>Beauty</option>
              <option>Transportation</option>
            </select>
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option>All Status</option>
              <option>Active</option>
              <option>Draft</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {courses.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No courses yet</h3>
              <p className="mt-1 text-sm text-slate-500">Create your first program to get started.</p>
              <Link href="/studio/courses/create" className="mt-6 inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> Create Course
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Course</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Category</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Hours</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Students</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-brand-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{course.title ?? course.name ?? 'Untitled'}</p>
                            <p className="text-sm text-slate-500 md:hidden">{getStatusBadge(course)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-sm text-slate-600">{course.category ?? '—'}</span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-sm text-slate-600">{getHoursDisplay(course)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-slate-900">{course.student_count}</span>
                      </td>
                      <td className="px-4 py-4">{getStatusBadge(course)}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={"/studio/courses/" + course.id} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                            <BookOpen className="w-4 h-4 text-brand-blue-600" />
                          </Link>
                          <Link href={"/studio/courses/" + course.id + "/edit"} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-slate-500" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
