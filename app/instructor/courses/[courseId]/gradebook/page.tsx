import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gradebook | Elevate For Humanity',
  description: 'Manage student grades and assessments.',
};

export default async function GradebookPage({ params }: { params: { courseId: string } }) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: course } = await db.from('training_courses').select('*').eq('id', params.courseId).single();
  const { data: enrollments } = await db.from('program_enrollments').select('*, profiles!inner(full_name, email)').eq('course_id', params.courseId).order('created_at');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/instructor-page-6.jpg" alt="Instructor portal" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/instructor" className="hover:text-primary">Instructor</Link></li><li>/</li><li><Link href="/instructor/courses" className="hover:text-primary">Courses</Link></li><li>/</li><li className="text-gray-900 font-medium">Gradebook</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">{course?.title} - Gradebook</h1><p className="text-gray-600 mt-2">Manage student grades</p></div>
            <div className="flex gap-3">
              <Link href={`/instructor/courses/${params.courseId}/assignments`} className="bg-brand-orange-600 text-white px-4 py-2 rounded-lg hover:bg-brand-orange-700 text-sm font-medium">SpeedGrader</Link>
              <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Export Grades</button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz Avg</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignments</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Grade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {enrollments && enrollments.length > 0 ? enrollments.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><p className="font-medium">{e.profiles?.full_name || 'Student'}</p><p className="text-sm text-gray-500">{e.profiles?.email}</p></td>
                  <td className="px-4 py-3"><div className="w-24 bg-gray-200 rounded-full h-2"><div className="bg-brand-blue-600 h-2 rounded-full" style={{ width: `${e.progress || 0}%` }}></div></div><span className="text-sm text-gray-500">{e.progress || 0}%</span></td>
                  <td className="px-4 py-3">{e.quiz_average || '-'}%</td>
                  <td className="px-4 py-3">{e.assignment_score || '-'}%</td>
                  <td className="px-4 py-3 font-medium">{e.final_grade || '-'}</td>
                  <td className="px-4 py-3"><button className="text-brand-blue-600 hover:text-brand-blue-800 text-sm">Edit</button></td>
                </tr>
              )) : <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No students enrolled</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
