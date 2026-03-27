import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Funding Verification Pending | Elevate LMS',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ courseId?: string }>;

export default async function EnrollmentPendingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { courseId } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/enrollment-pending');

  // Confirm the enrollment is actually in pending_funding_verification.
  // If it has since been verified, redirect to the course.
  if (courseId) {
    const db = createAdminClient();
    const { data: enrollment } = await db
      .from('program_enrollments')
      .select('enrollment_state, status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (
      !enrollment ||
      (enrollment.enrollment_state !== 'pending_funding_verification' &&
        enrollment.status !== 'pending_funding_verification')
    ) {
      // Enrollment is active or not found — send them to the course
      redirect(`/lms/courses/${courseId}`);
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        {/* Status icon */}
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Funding Verification Required
        </h1>

        <p className="text-gray-600 mb-1">
          {profile?.full_name ? `Hi ${profile.full_name.split(' ')[0]}, your` : 'Your'} enrollment
          is provisionally confirmed, but your funding source has not yet been verified.
        </p>
        <p className="text-gray-600 mb-6">
          Course content is locked until an administrator confirms your funding.
        </p>

        {/* What to do */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left mb-6">
          <p className="text-sm font-semibold text-orange-900 mb-2">What to do next</p>
          <ul className="text-sm text-orange-800 space-y-1.5 list-disc list-inside">
            <li>Reply to your enrollment confirmation email with proof of funding</li>
            <li>Contact your program advisor directly</li>
            <li>
              Email{' '}
              <a
                href="mailto:admissions@elevateforhumanity.org"
                className="underline hover:text-orange-900"
              >
                admissions@elevateforhumanity.org
              </a>{' '}
              with your name and program
            </li>
          </ul>
        </div>

        <p className="text-xs text-gray-400 mb-6">
          SLA: administrators review funding verification requests within 14 days of enrollment.
          If you have not heard back, please contact us directly.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/lms/programs"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            Browse Programs
          </Link>
          <a
            href="mailto:admissions@elevateforhumanity.org"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand-blue-600 text-white text-sm font-medium hover:bg-brand-blue-700"
          >
            Contact Admissions
          </a>
        </div>
      </div>
    </main>
  );
}
