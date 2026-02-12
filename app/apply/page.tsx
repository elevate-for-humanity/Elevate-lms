import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import { resolveProgram } from '@/lib/program-registry';

export const metadata: Metadata = {
  title: 'Apply | Elevate for Humanity',
  description: 'Apply for free workforce training programs, employer partnerships, or staff positions at Elevate for Humanity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply',
  },
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; pathway?: string }>;
}) {
  const params = await searchParams;
  const rawProgram = (params?.program || params?.pathway || '').trim();

  if (rawProgram) {
    const entry = resolveProgram(rawProgram);
    if (entry) {
      if (entry.dedicatedApplyPage) {
        redirect(entry.dedicatedApplyPage);
      }
      redirect(`/apply/student?program=${entry.slug}`);
    }
    redirect('/apply/student');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="py-10 sm:py-14 px-4 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Start Here
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Pick the path that fits you. Each application takes 5-10 minutes and does not require an account.
          </p>
        </div>
      </section>

      {/* Application blocks */}
      <section className="max-w-6xl mx-auto px-4 py-10 sm:py-14 space-y-6">

        {/* Student — full width, primary */}
        <Link
          href="/apply/student"
          className="block relative overflow-hidden rounded-2xl group"
        >
          <div className="relative h-[340px] sm:h-[380px]">
            <Image
              src="/hero-images/programs-hero.jpg"
              alt="Students in career training programs"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-6 sm:px-10 md:px-14 max-w-2xl">
                <span className="inline-block bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                  Most Popular
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Student Application
                </h2>
                <p className="text-white/90 text-base sm:text-lg mb-2">
                  Apply for career training in healthcare, skilled trades, barbering, IT, and more.
                  Most programs are <strong>100% free</strong> through WIOA, WRG, and JRI funding.
                </p>
                <ul className="text-white/80 text-sm space-y-1 mb-5">
                  <li>- No tuition for qualifying Indiana residents</li>
                  <li>- Pick your program during the application</li>
                  <li>- We check your funding eligibility for you</li>
                  <li>- Response within 1-2 business days</li>
                </ul>
                <span className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-6 py-3 rounded-lg group-hover:gap-3 transition-all text-sm sm:text-base">
                  Apply Now <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Three secondary blocks */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* Employer */}
          <Link
            href="/apply/employer"
            className="block relative overflow-hidden rounded-2xl group"
          >
            <div className="relative h-[280px]">
              <Image
                src="/hero-images/employer-hero.jpg"
                alt="Employer meeting with workforce team"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/20" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-white mb-2">
                  Employer Partnership
                </h2>
                <p className="text-white/85 text-sm mb-3 leading-relaxed">
                  Hire pre-trained candidates at no cost. We handle recruiting, screening, and
                  skills training. You get job-ready workers with industry certifications.
                  WOTC tax credits may apply.
                </p>
                <span className="inline-flex items-center gap-2 text-white font-semibold text-sm group-hover:gap-3 transition-all">
                  Partner With Us <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>

          {/* Staff / Instructor */}
          <Link
            href="/apply/staff"
            className="block relative overflow-hidden rounded-2xl group"
          >
            <div className="relative h-[280px]">
              <Image
                src="/images/heroes/hero-students.jpg"
                alt="Instructor working with students"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/20" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-white mb-2">
                  Staff &amp; Instructor
                </h2>
                <p className="text-white/85 text-sm mb-3 leading-relaxed">
                  Teach career skills or support student success as an advisor, case manager,
                  or admin. Flexible schedules, competitive pay, and the chance to change lives
                  in your community.
                </p>
                <span className="inline-flex items-center gap-2 text-white font-semibold text-sm group-hover:gap-3 transition-all">
                  Join Our Team <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>

          {/* Program Holder */}
          <Link
            href="/apply/program-holder"
            className="block relative overflow-hidden rounded-2xl group"
          >
            <div className="relative h-[280px]">
              <Image
                src="/images/heroes/partner-hero.jpg"
                alt="Organization leaders discussing training programs"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/20" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-white mb-2">
                  Program Holder
                </h2>
                <p className="text-white/85 text-sm mb-3 leading-relaxed">
                  License our LMS platform and curriculum to run training programs under your
                  own brand. We provide the tech, content, and compliance — you serve your
                  community.
                </p>
                <span className="inline-flex items-center gap-2 text-white font-semibold text-sm group-hover:gap-3 transition-all">
                  Become a Program Holder <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Track existing application */}
        <div className="text-center pt-4">
          <p className="text-slate-500 text-sm">
            Already applied?{' '}
            <Link href="/apply/track" className="text-blue-600 hover:underline font-medium">
              Track your application status
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
