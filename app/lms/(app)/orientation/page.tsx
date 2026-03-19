import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { requireRole } from '@/lib/auth/require-role';
import ProgramOrientationVideo from '@/components/student/ProgramOrientationVideo';
import { Book, Users, Award, Briefcase } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Program Orientation | Student Dashboard',
  description:
    'Complete your program orientation to get started with your training.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/(app)/orientation',
  },
};

export default async function OrientationPage() {
  const { user, profile } = await requireRole([
    'student',
    'admin',
    'super_admin',
  ]);

  // If already completed, show completion message
  const isCompleted = profile.orientation_completed;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Orientation" }]} />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
            Program Orientation
          </h1>
          <p className="text-lg text-black">
            {isCompleted
              ? 'You have completed your orientation. Review the video anytime.'
              : 'Watch this orientation video to get started with your training journey.'}
          </p>
        </div>

        {/* Completion Status */}
        {isCompleted && (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <h3 className="font-bold text-brand-green-900 mb-1">
                  Orientation Completed
                </h3>
                <p className="text-sm text-brand-green-700">
                  You've completed your orientation. You can now proceed to
                  verify your eligibility and enroll in programs.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Orientation Video */}
            <ProgramOrientationVideo
              title="Welcome to Elevate for Humanity"
              description="Learn about our programs, what to expect, and how to succeed in your training journey."
              videoUrl="/videos/orientation-full.mp4"
              onComplete={async () => {
                'use server';
                const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Orientation" }]} />
      </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
                await db
                  .from('profiles')
                  .update({ orientation_completed: true })
                  .eq('id', user.id);
              }}
            />

            {/* What You'll Learn */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-black mb-4">
                What You'll Learn
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-black">
                    How our Free training for eligible participants work
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-black">
                    Available programs in healthcare, skilled trades, and
                    business
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-black">
                    Funding options (WIOA, WRG, employer-sponsored)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-black">
                    Support services (childcare, transportation, tools)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-black">
                    Job placement assistance and career services
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-black">
                    How to succeed in your training program
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Steps */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-black mb-4">
                Next Steps
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-brand-blue-600">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-black">
                      Watch Orientation
                    </p>
                    <p className="text-sm text-black">
                      Complete the video above
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-black">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-black">
                      Verify Eligibility
                    </p>
                    <p className="text-sm text-black">
                      Check if you qualify for free training
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-black">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-black">Choose Program</p>
                    <p className="text-sm text-black">
                      Browse 20+ training programs
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-black">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-black">Start Training</p>
                    <p className="text-sm text-black">
                      Begin your career journey
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-black mb-4">
                Quick Links
              </h3>
              <div className="space-y-2">
                <Link
                  href="/programs"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition"
                >
                  <Book className="w-5 h-5 text-brand-blue-600" />
                  <span className="text-sm font-medium text-black">
                    Browse Programs
                  </span>
                </Link>
                <Link
                  href="/how-it-works"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition"
                >
                  <Users className="w-5 h-5 text-brand-blue-600" />
                  <span className="text-sm font-medium text-black">
                    How It Works
                  </span>
                </Link>
                <Link
                  href="/financial-aid"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition"
                >
                  <Award className="w-5 h-5 text-brand-blue-600" />
                  <span className="text-sm font-medium text-black">
                    Funding Options
                  </span>
                </Link>
                <Link
                  href="/career-services"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition"
                >
                  <Briefcase className="w-5 h-5 text-brand-blue-600" />
                  <span className="text-sm font-medium text-black">
                    Career Services
                  </span>
                </Link>
              </div>
            </div>

            {/* Support */}
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-brand-blue-900 mb-2">
                Need Help?
              </h3>
              <p className="text-sm text-brand-blue-700 mb-4">
                Our team is here to support you every step of the way.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-medium text-sm"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        {isCompleted && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-black mb-1">
                  Ready for the Next Step?
                </h3>
                <p className="text-black">
                  Verify your eligibility to unlock program enrollment.
                </p>
              </div>
              <Link
                href="/start"
                className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-medium whitespace-nowrap"
              >
                Verify Eligibility →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
