import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Lms (Public)',
  description: 'Internal page for Lms (Public)',
  path: '/lms/(public)',
});

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LmsPublicPage() {
  // Check if user is logged in and redirect to dashboard
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
  const { data }: any = await supabase.auth.getUser();

  if (data?.user) {
    redirect('/lms/dashboard');
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-10">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900">
            Student Learning Portal
          </h1>
          <p className="mt-4 text-lg text-zinc-700">
            Access your courses, track your progress, and earn
            industry-recognized certifications. Your path to a better career
            starts here.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login?next=/lms/dashboard"
              className="rounded-xl bg-brand-blue-600 text-white px-5 py-3 font-bold hover:bg-brand-blue-700 text-center"
            >
              Student Login
            </Link>
            <Link
              href="/apply"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 font-bold hover:bg-zinc-50 text-center"
            >
              Apply Now
            </Link>
          </div>
        </section>

        <section className="mt-14 grid md:grid-cols-3 gap-6">
          <Card
            title="Your Courses"
            desc="Access all your enrolled courses, lessons, and training materials in one place."
            bullets={[
              'Video lessons & resources',
              'Interactive assignments',
              'Track your progress',
            ]}
          />
          <Card
            title="Earn Certificates"
            desc="Complete courses and earn industry-recognized certifications to boost your career."
            bullets={[
              'Industry certifications',
              'Downloadable certificates',
              'LinkedIn-ready credentials',
            ]}
          />
          <Card
            title="Career Support"
            desc="Get help every step of the way with dedicated support and career guidance."
            bullets={[
              'Instructor support',
              'Career counseling',
              'Job placement assistance',
            ]}
          />
        </section>

        <section className="mt-14 rounded-3xl border border-brand-blue-200 bg-brand-blue-50 p-8 sm:p-10">
          <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-zinc-900">
            Ready to Start Learning?
          </h2>
          <p className="mt-4 text-lg text-zinc-700 max-w-3xl">
            Students across Indiana are building better careers through
            our free training programs. 100% funded - no tuition, no hidden
            costs.
          </p>
          <ol className="mt-6 space-y-3 list-decimal pl-5 text-zinc-700 max-w-3xl">
            <li>Apply for a program that matches your career goals</li>
            <li>Get approved and receive your student login credentials</li>
            <li>Access your courses and start learning immediately</li>
            <li>Complete lessons, assignments, and earn certificates</li>
            <li>Graduate with job-ready skills and career support</li>
          </ol>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link
              href="/apply"
              className="rounded-xl bg-brand-blue-600 text-white px-5 py-3 font-bold hover:bg-brand-blue-700 text-center"
            >
              Apply Now - It's Free
            </Link>
            <Link
              href="/login?next=/lms/dashboard"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-3 font-bold hover:bg-zinc-50 text-center"
            >
              Already Enrolled? Login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({
  title,
  desc,
  bullets,
}: {
  title: string;
  desc: string;
  bullets: string[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
      <p className="mt-2 text-zinc-700">{desc}</p>
      <ul className="mt-4 space-y-2 text-sm text-zinc-700 list-disc pl-5">
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </div>
  );
}
