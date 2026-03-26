import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Award, Users, Shield, CheckCircle } from 'lucide-react';
import EnrollmentForm from './EnrollmentForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from('courses')
    .select('title, description')
    .eq('id', courseId)
    .single();
  return {
    title: course ? `Enroll in ${course.title}` : 'Enroll',
    description: course?.description ?? undefined,
  };
}

export default async function EnrollPage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/courses/' + courseId + '/enroll');

  const { data: course, error } = await supabase
    .from('courses')
    .select('id, title, description, program_id')
    .eq('id', courseId)
    .single();
  if (error || !course) notFound();

  const { data: existingByCourse } = await supabase
    .from('program_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  const existingByProgram = course.program_id
    ? await supabase
        .from('program_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('program_id', course.program_id)
        .maybeSingle()
        .then(r => r.data)
    : null;

  if (existingByCourse || existingByProgram) redirect(`/lms/courses/${courseId}`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', user.id)
    .single();

  const { count: lessonCount } = await supabase
    .from('course_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId);

  const { count: studentCount } = await supabase
    .from('program_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId);

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href={`/lms/courses/${courseId}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </Link>
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Enroll in {course.title}</h1>
              <p className="text-slate-600 mb-8">Complete your enrollment to start learning immediately.</p>
              <EnrollmentForm
                courseId={courseId}
                courseName={course.title}
                price={0}
                userEmail={profile?.email ?? (user as any).email ?? ''}
                userName={profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : ''}
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden sticky top-8">
              <div className="h-40 bg-slate-700 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-white/50" />
              </div>
              <div className="p-6">
                <h2 className="font-bold text-lg text-slate-900 mb-4">{course.title}</h2>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-brand-green-600">FREE</span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-600"><BookOpen className="w-5 h-5" /><span>{lessonCount ?? 0} lessons</span></div>
                  <div className="flex items-center gap-3 text-slate-600"><Users className="w-5 h-5" /><span>{studentCount ?? 0} students enrolled</span></div>
                  <div className="flex items-center gap-3 text-slate-600"><Award className="w-5 h-5" /><span>Certificate of completion</span></div>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="font-semibold text-slate-900 mb-3">What&apos;s included:</h3>
                  <ul className="space-y-2">
                    {['Full course access', 'Downloadable resources', 'Quizzes & assessments', 'Certificate upon completion', 'Lifetime access'].map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-brand-green-500 flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                  <Shield className="w-4 h-4" /><span>Secure enrollment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
