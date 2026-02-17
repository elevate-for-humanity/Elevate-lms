import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMyPartnerContext } from '@/lib/partner/access';
import { getPartnerStudentsWithTraining } from '@/lib/partner/students';
import {
  Users,
  BookOpen,
  Award,
  ChevronDown,
  ChevronRight,
  Download,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Students | Partner Portal | Elevate LMS',
  description: 'View your students and their training progress.',
};

export default async function PartnerStudentsPage() {
  const ctx = await getMyPartnerContext();
  if (!ctx?.user) redirect('/partners/login');

  const shopIds = (ctx.shops || []).map((s: any) => s.shop_id || s.id);
  const students = await getPartnerStudentsWithTraining(shopIds);

  const totalStudents = students.length;
  const withCourses = students.filter((s) => s.courses.length > 0).length;
  const completed = students.filter((s) =>
    s.courses.some((c) => c.status === 'completed')
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-600 mt-1">
              Training progress for your placed students
            </p>
          </div>
          <a
            href="/api/partner/exports/completions"
            className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
            <div className="p-3 bg-brand-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-sm text-gray-500">Total Students</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
            <div className="p-3 bg-brand-green-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-brand-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{withCourses}</p>
              <p className="text-sm text-gray-500">Enrolled in Courses</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
            <div className="p-3 bg-brand-orange-100 rounded-lg">
              <Award className="w-5 h-5 text-brand-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completed}</p>
              <p className="text-sm text-gray-500">Completed a Course</p>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Courses
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Progress
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Certificates
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.student_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {student.student_name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {student.shop_name}
                    </td>
                    <td className="px-4 py-3">
                      {student.courses.length > 0 ? (
                        <div className="space-y-1">
                          {student.courses.map((course) => (
                            <div
                              key={course.course_id}
                              className="text-sm"
                            >
                              <span className="text-gray-900">
                                {course.course_title}
                              </span>
                              <span className="text-gray-400 ml-2">
                                {course.progress}%
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Not enrolled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              student.overall_progress === 100
                                ? 'bg-brand-green-500'
                                : student.overall_progress > 0
                                  ? 'bg-brand-blue-600'
                                  : 'bg-gray-300'
                            }`}
                            style={{
                              width: `${student.overall_progress}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {student.overall_progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {student.certificate_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-brand-green-700 bg-brand-green-50 px-2 py-0.5 rounded text-xs font-medium">
                          <Award className="w-3 h-3" />
                          {student.certificate_count}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          student.placement_status === 'active'
                            ? 'bg-brand-green-50 text-brand-green-700'
                            : student.placement_status === 'completed'
                              ? 'bg-brand-blue-50 text-brand-blue-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {student.placement_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No students placed at your locations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
