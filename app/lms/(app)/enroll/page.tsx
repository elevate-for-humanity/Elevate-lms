import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Clock,
  Award,
  Search,
  ArrowRight,
CheckCircle, } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enroll in Courses | Elevate LMS',
  description: 'Browse and enroll in courses to start your learning journey.',
};

interface Props {
  searchParams: Promise<{ course?: string }>;
}

export default async function EnrollPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Enroll" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = params.course 
      ? `/login?redirect=/lms/enroll?course=${params.course}`
      : '/login?redirect=/lms/enroll';
    redirect(redirectUrl);
  }

  // If course ID provided, redirect to specific enrollment page
  if (params.course) {
    redirect(`/lms/courses/${params.course}/enroll`);
  }

  // Get user's existing enrollments — training_enrollments is the canonical LMS table
  const { data: enrollments } = await db
    .from('training_enrollments')
    .select('course_id')
    .eq('user_id', user.id);

  const enrolledCourseIds = new Set(enrollments?.map(e => e.course_id) || []);

  // Fetch available courses (not enrolled)
  const { data: courses } = await db
    .from('training_courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const availableCourses = courses?.filter(c => !enrolledCourseIds.has(c.id)) || [];

  // Fetch partner courses
  const { data: partnerCourses } = await db
    .from('partner_lms_courses')
    .select(`
      *,
      partner_lms_providers (
        provider_name,
        provider_type
      )
    `)
    .eq('active', true)
    .order('course_name');

  // Get partner enrollments
  const { data: partnerEnrollments } = await db
    .from('partner_lms_enrollments')
    .select('course_id')
    .eq('student_id', user.id);

  const enrolledPartnerIds = new Set(partnerEnrollments?.map(e => e.course_id) || []);
  const availablePartnerCourses = partnerCourses?.filter(c => !enrolledPartnerIds.has(c.id)) || [];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Enroll" }]} />
        </div>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Enroll in Courses</h1>
          <p className="text-slate-600">
            Choose from our catalog of courses to start your learning journey.
          </p>
        </div>

        {/* Internal Courses */}
        {availableCourses.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Available Courses</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((course) => {
                const isFree = !course.price || course.price === 0;
                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition"
                  >
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
                      <div className="h-40 bg-brand-blue-600 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-white/50" />
                      </div>
                    )}

                    <div className="p-5">
                      <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">
                        {course.course_name}
                      </h3>
                      {course.description && (
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                          {course.description}
                        </p>
                      )}

                      {/* Course Meta */}
                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                        {course.duration_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration_hours}h</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          <span>Certificate</span>
                        </div>
                      </div>

                      {/* Price & Enroll */}
                      <div className="flex items-center justify-between">
                        <div>
                          {isFree ? (
                            <span className="text-lg font-bold text-brand-green-600">FREE</span>
                          ) : (
                            <span className="text-lg font-bold text-slate-900">${course.price}</span>
                          )}
                        </div>
                        <Link
                          href={`/lms/courses/${course.id}/enroll`}
                          className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
                        >
                          Enroll
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Partner Courses */}
        {availablePartnerCourses.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Partner Courses</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availablePartnerCourses.map((course) => {
                const provider = course.partner_lms_providers as { provider_name: string; provider_type: string } | null;
                const price = course.price || 0;
                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="h-40 bg-brand-blue-600 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white/50" />
                    </div>

                    <div className="p-5">
                      {provider && (
                        <p className="text-xs text-brand-blue-600 font-semibold mb-1">
                          {provider.provider_name}
                        </p>
                      )}
                      <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">
                        {course.course_name}
                      </h3>
                      {course.description && (
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                          {course.description}
                        </p>
                      )}

                      {/* Course Meta */}
                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                        {course.hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{course.hours}h</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          <span>Certificate</span>
                        </div>
                      </div>

                      {/* Price & Enroll */}
                      <div className="flex items-center justify-between">
                        <div>
                          {price === 0 ? (
                            <span className="text-lg font-bold text-brand-green-600">FREE</span>
                          ) : (
                            <span className="text-lg font-bold text-slate-900">${price}</span>
                          )}
                        </div>
                        {course.enrollment_link ? (
                          <a
                            href={course.enrollment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
                          >
                            Enroll
                            <ArrowRight className="w-4 h-4" />
                          </a>
                        ) : (
                          <Link
                            href={`/lms/courses/${course.id}/enroll`}
                            className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
                          >
                            Enroll
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* No Courses Available */}
        {availableCourses.length === 0 && availablePartnerCourses.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">All Caught Up!</h2>
            <p className="text-slate-600 mb-6">
              You&apos;re enrolled in all available courses. New courses will appear here when added to your program.
            </p>
            <Link
              href="/lms/courses"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              View My Courses
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Already Enrolled Section */}
        {enrolledCourseIds.size > 0 && (
          <section className="mt-12 bg-brand-blue-50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-brand-blue-900">Already Enrolled</h3>
                <p className="text-brand-blue-700 text-sm">
                  You&apos;re enrolled in {enrolledCourseIds.size} course{enrolledCourseIds.size !== 1 ? 's' : ''}.
                </p>
              </div>
              <Link
                href="/lms/dashboard"
                className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
