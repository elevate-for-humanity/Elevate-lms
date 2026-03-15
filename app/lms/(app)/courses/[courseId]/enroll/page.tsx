import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Award,
  Users,
  Shield,
CheckCircle, } from 'lucide-react';
import EnrollmentForm from './EnrollmentForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return { title: 'Enroll | Elevate LMS' };
  }

  const { data: course } = await db
    .from('training_courses')
    .select('course_name')
    .eq('id', courseId)
    .single();

  return {
    title: course ? `Enroll in ${course.course_name} | Elevate LMS` : 'Enroll | Elevate LMS',
    description: 'Enroll in this course to start learning.',
  };
}

export default async function CourseEnrollPage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/lms/courses/' + courseId + '/enroll');
  }

  // Fetch course details
  const { data: course, error } = await db
    .from('training_courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error || !course) {
    notFound();
  }

  // Check if already enrolled — training_enrollments is the canonical LMS enrollment table
  const { data: existingEnrollment } = await db
    .from('training_enrollments')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existingEnrollment) {
    redirect(`/lms/courses/${courseId}`);
  }

  // Get user profile
  const { data: profile } = await db
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', user.id)
    .single();

  // Get lesson count
  const { count: lessonCount } = await db
    .from('training_lessons')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);

  // Get enrolled student count
  const { count: studentCount } = await db
    .from('training_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);

  const isFree = !course.price || course.price === 0;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <Link
          href={`/lms/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Enrollment Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Enroll in {course.course_name}
              </h1>
              <p className="text-slate-600 mb-8">
                Complete your enrollment to start learning immediately.
              </p>

              <EnrollmentForm 
                courseId={courseId}
                courseName={course.course_name}
                price={course.price || 0}
                userEmail={profile?.email || user.email || ''}
                userName={profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : ''}
              />
            </div>
          </div>

          {/* Course Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden sticky top-8">
              {/* Course Image */}
              {course.thumbnail_url ? (
                <div className="relative h-40">
                  <Image
                    src={course.thumbnail_url}
                    alt={course.course_name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-40 bg-slate-700 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white/50" />
                </div>
              )}

              <div className="p-6">
                <h2 className="font-bold text-lg text-slate-900 mb-4">{course.course_name}</h2>

                {/* Price */}
                <div className="mb-6">
                  {isFree ? (
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-brand-green-600">FREE</span>
                      <span className="bg-brand-green-100 text-brand-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                        No Cost
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-slate-900">
                        ${course.price}
                      </span>
                      {course.original_price && course.original_price > course.price && (
                        <span className="text-lg text-slate-400 line-through">
                          ${course.original_price}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Course Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-600">
                    <BookOpen className="w-5 h-5" />
                    <span>{lessonCount || 0} lessons</span>
                  </div>
                  {course.duration_hours && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Clock className="w-5 h-5" />
                      <span>{course.duration_hours} hours</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-slate-600">
                    <Users className="w-5 h-5" />
                    <span>{studentCount || 0} students enrolled</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Award className="w-5 h-5" />
                    <span>Certificate of completion</span>
                  </div>
                </div>

                {/* What's Included */}
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="font-semibold text-slate-900 mb-3">What&apos;s included:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      Full course access
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      Downloadable resources
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      Quizzes & assessments
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      Certificate upon completion
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      Lifetime access
                    </li>
                  </ul>
                </div>

                {/* Trust Badge */}
                <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                  <Shield className="w-4 h-4" />
                  <span>Secure enrollment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
