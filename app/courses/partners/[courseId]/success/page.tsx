import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  alternates: {
    canonical:
      'https://www.elevateforhumanity.org/courses/partners/[courseId]/success',
  },
  title: 'Enrollment Successful | Elevate For Humanity',
  description: 'You have successfully enrolled in the course',
};

export default async function EnrollmentSuccessPage({
  params,
}: {
  params: { courseId: string };
}) {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Fetch enrollment details
  const { data: enrollment } = await supabase
    .from('partner_enrollments')
    .select(
      '*, partner_courses(course_name, partner_lms_providers(provider_name))'
    )
    .eq('user_id', user.id)
    .eq('partner_course_id', params.courseId)
    .single();

  if (!enrollment) {
    redirect('/courses/partners');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-[300px] md:h-[380px] lg:h-[420px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/efh/sections/coaching.jpg"
          alt="Success"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-2xl">
            Success
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100 drop-shadow-lg">
            Transform your career with free training and industry certifications
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/programs"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

      <section className="   text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <svg
                className="w-20 h-20 mx-auto text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-2xl md:text-3xl lg:text-4xl">
              Enrollment Successful!
            </h1>
            <p className="text-base md:text-lg text-green-100">
              You're all set to start learning
            </p>
          </div>
        </div>
      </section>

      {/* Success Details */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Course Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
              <h2 className="text-2xl font-bold mb-4">Course Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-black">Course Name</p>
                  <p className="font-semibold text-lg">
                    {enrollment.partner_courses?.course_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-black">Provider</p>
                  <p className="font-medium">
                    {
                      enrollment.partner_courses?.partner_lms_providers
                        ?.provider_name
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-black">Enrollment Date</p>
                  <p className="font-medium">
                    {new Date(enrollment.enrolled_at).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-black">Status</p>
                  <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-brand-green-100 text-green-800">
                    {enrollment.enrollment_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-brand-blue-900 mb-4">What's Next?</h3>
              <ul className="space-y-3 text-brand-blue-800">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Access your course materials from the student dashboard
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Your progress will be tracked automatically as you complete
                    lessons
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Upon completion, you'll receive a certificate of achievement
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Get help from AI tutors and instructors anytime you need it
                  </span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/lms/courses"
                className="flex-1 px-6 py-3 bg-brand-blue-600 text-white text-center rounded-lg hover:bg-brand-blue-700 transition-colors font-medium"
              >
                Go to My Courses
              </Link>
              <Link
                href="/learner/dashboard"
                className="flex-1 px-6 py-3 border border-gray-300 text-black text-center rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
