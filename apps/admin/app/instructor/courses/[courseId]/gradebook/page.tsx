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

export default async function GradebookPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: course } = await supabase
    .from('lms_courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle();

  const { data: rawEnrollments } = await supabase
    .from('program_enrollments')
    .select('*, progress_percent')
    .eq('course_id', courseId)
    .order('created_at');

  const gbUserIds = [...new Set((rawEnrollments ?? []).map((e: any) => e.user_id).filter(Boolean))];
  const { data: gbProfiles } = gbUserIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', gbUserIds)
    : { data: [] };
  const gbProfileMap = Object.fromEntries((gbProfiles ?? []).map((p: any) => [p.id, p]));
  const enrollments = (rawEnrollments ?? []).map((e: any) => ({
    ...e,
    profiles: gbProfileMap[e.user_id] ?? null,
  }));

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[160px] overflow-hidden sm:h-[220px] md:h-[280px]">
        <Image
          src="/images/pages/instructor-page-6.webp"
          alt="Instructor portal"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <nav className="mb-4 text-sm">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li><Link href="/instructor" className="hover:text-primary">Instructor</Link></li>
              <li>/</li>
              <li><Link href="/instructor/courses" className="hover:text-primary">Courses</Link></li>
              <li>/</li>
              <li className="font-medium text-slate-900">Gradebook</li>
            </ol>
          </nav>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{course?.title || 'Course'} - Gradebook</h1>
              <p className="mt-2 text-slate-700">Manage student grades</p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/instructor/courses/${courseId}/assignments`}
                className="rounded-lg bg-brand-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-orange-700"
              >
                SpeedGrader
              </Link>
              <button type="button" className="rounded-lg bg-brand-blue-600 px-4 py-2 text-white hover:bg-brand-blue-700">
                Export Grades
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {['Student', 'Progress', 'Quiz Avg', 'Assignments', 'Final Grade', 'Actions'].map((label) => (
                  <th key={label} className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-700">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {enrollments.length > 0 ? enrollments.map((e: any) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{e.profiles?.full_name || 'Student'}</p>
                    <p className="text-sm text-slate-700">{e.profiles?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-24 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-brand-blue-600" style={{ width: `${Math.max(0, Math.min(100, Number(e.progress_percent || 0)))}%` }} />
                    </div>
                    <span className="text-sm text-slate-700">{e.progress_percent || 0}%</span>
                  </td>
                  <td className="px-4 py-3">{e.quiz_average ?? '-'}{e.quiz_average != null ? '%' : ''}</td>
                  <td className="px-4 py-3">{e.assignment_score ?? '-'}{e.assignment_score != null ? '%' : ''}</td>
                  <td className="px-4 py-3 font-medium">{e.final_grade || '-'}</td>
                  <td className="px-4 py-3"><button type="button" className="text-sm text-brand-blue-600 hover:text-brand-blue-800">Edit</button></td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-700">No students enrolled</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
