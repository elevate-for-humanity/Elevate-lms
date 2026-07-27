import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Plus, Search, Filter, MoreVertical } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Courses | Elevate Admin',
  description: 'Manage training programs and courses in the Elevate LMS.',
};

export default function CoursesPage() {
  const courses = [
    { id: 1, title: 'Medical Assistant Training', program: 'Healthcare', students: 45, status: 'Active', hours: 120 },
    { id: 2, title: 'HVAC Technician', program: 'Skilled Trades', students: 32, status: 'Active', hours: 200 },
    { id: 3, title: 'Barber Apprenticeship', program: 'Beauty', students: 28, status: 'Active', hours: 1500 },
    { id: 4, title: 'CDL Class A Training', program: 'Transportation', students: 15, status: 'Active', hours: 160 },
    { id: 5, title: 'Phlebotomy Certification', program: 'Healthcare', students: 38, status: 'Active', hours: 90 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
              <p className="text-sm text-slate-500 mt-1">Manage training programs and curriculum</p>
            </div>
            <Link
              href="/admin/programs/catalog"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Course
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
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
              <option>Archived</option>
            </select>
          </div>
        </div>
      </section>

      {/* Courses Table */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Course</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Program</th>
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
                          <p className="font-medium text-slate-900">{course.title}</p>
                          <p className="text-sm text-slate-500 md:hidden">{course.program}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-600">{course.program}</span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-slate-600">{course.hours} hrs</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-slate-900">{course.students}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {course.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-slate-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
