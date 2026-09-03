export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'Instructor Portal | Elevate For Humanity',
  description: 'Manage courses, track student progress, and access teaching tools.',
  alternates: {
    canonical: 'https://admin.elevateforhumanity.org/instructor',
  },
  robots: { index: false, follow: false },
};

export default async function InstructorPortalLanding() {
  const { profile } = await requireRole(['instructor', 'admin', 'staff']);
  if (profile?.role === 'admin' || profile?.role === 'staff') {
    redirect('/instructor/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Instructor Portal' }]} />
        </div>
      </div>

      <section className="relative w-full">
        <div className="relative h-[38vh] min-h-[320px] max-h-[520px] w-full overflow-hidden">
          <Image
            src="/images/pages/instructor-hero.webp"
            alt="Instructor Portal"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="bg-white py-10">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <h1 className="mb-3 text-3xl font-bold text-slate-900 md:text-4xl">Instructor Portal</h1>
            <p className="mx-auto max-w-3xl text-lg text-slate-600">
              Manage your courses, track student progress, grade assignments, and communicate with learners.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">Portal Features</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              ['/images/pages/instructor-page-2.webp', 'Course Management', 'Create and manage your course content and materials.'],
              ['/images/pages/instructor-page-3.webp', 'Student Roster', 'View enrolled students and their information.'],
              ['/images/pages/instructor-page-4.webp', 'Progress Tracking', 'Monitor student progress and completion rates.'],
              ['/images/pages/instructor-grading.webp', 'Grading', 'Grade assignments and provide feedback.'],
              ['/images/pages/instructor-page-5.webp', 'Communication', 'Message students and make announcements.'],
              ['/images/pages/certifications-page-1.webp', 'Certifications', 'Issue certificates to completing students.'],
            ].map(([src, title, description]) => (
              <div key={title} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="relative h-32 overflow-hidden">
                  <Image src={src} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
                  <p className="text-slate-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">Start Teaching</h2>
          <p className="mb-8 text-lg text-slate-600">
            Already an instructor? Sign in. Want to teach? Apply today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/login?redirect=/instructor/dashboard"
              className="rounded-lg bg-brand-blue-600 px-8 py-4 font-bold text-white transition hover:bg-brand-blue-700"
            >
              Instructor sign in
            </Link>
            <Link
              href={`${process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl}/apply?role=instructor`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-slate-100 px-8 py-4 font-bold text-slate-900 transition hover:bg-slate-200"
            >
              Become an Instructor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
