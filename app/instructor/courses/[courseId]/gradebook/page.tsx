import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gradebook | Elevate For Humanity',
  description: 'Manage student grades and assessments.',
};

export default async function GradebookPage({ params }: { params: { courseId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: course } = await supabase.from('training_courses').select('*').eq('id', params.courseId).single();
  const { data: rawEnrollments } = await supabase.from('program_enrollments').select('*, progress_percent').eq('course_id', params.courseId).order('created_at');

  // Hydrate profiles separately (user_id → auth.users, no FK to profiles)
  const gbUserIds = [...new Set((rawEnrollments ?? []).map((e: any) => e.user_id).filter(Boolean))];
  const { data: gbProfiles } = gbUserIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', gbUserIds)
    : { data: [] };
  const gbProfileMap = Object.fromEntries((gbProfiles ?? []).map((p: any) => [p.id, p]));
  const enrollments = (rawEnrollments ?? []).map((e: any) => ({ ...e, profiles: gbProfileMap[e.user_id] ?? null }));

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
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
            <thead className="bg-white">
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
                <tr key={e.id} className="hover:bg-white">
                  <td className="px-4 py-3"><p className="font-medium">{e.profiles?.full_name || 'Student'}</p><p className="text-sm text-gray-500">{e.profiles?.email}</p></td>
                  <td className="px-4 py-3"><div className="w-24 bg-gray-200 rounded-full h-2"><div className="bg-white h-2 rounded-full" style={{ width: `${e.progress_percent || 0}%` }}></div></div><span className="text-sm text-gray-500">{e.progress_percent || 0}%</span></td>
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
