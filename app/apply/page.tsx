import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ApplyHeroVideo from './ApplyHeroVideo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import { resolveProgram } from '@/lib/program-registry';

export const metadata: Metadata = {
  title: 'Apply | Elevate for Humanity',
  description: 'Apply for workforce training programs, employer partnerships, or program holder positions at Elevate for Humanity.',
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
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply' }]} />
        </div>
      </div>

      {/* Hero banner — full width video, top of page */}
      <section className="relative w-full h-[180px] sm:h-[280px] md:h-[380px] overflow-hidden">
        <ApplyHeroVideo />
      </section>

      {/* Elevate branding over hero */}
      <div className="flex items-center justify-center -mt-8 relative z-20">
        <div className="bg-white/90 backdrop-blur-sm px-5 py-2 rounded-lg shadow">
          <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Elevate for Humanity</span>
        </div>
      </div>

      {/* Heading */}
      <section className="pt-4 pb-8 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Start Your New Career
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Pick the path that fits you. Each application takes 5-10 minutes, no account needed. Funding available for qualifying students.
          </p>
        </div>
      </section>



      {/* Application cards */}
      <section className="max-w-6xl mx-auto px-4 pb-10 sm:pb-14 space-y-8">

        {/* Student — full width, image fills left side */}
        <Link
          href="/apply/student"
          className="block rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow group"
        >
          <div className="flex flex-col md:flex-row">
            <div className="relative w-full md:w-2/5 h-[200px] md:h-auto md:min-h-[280px]">
              <Image
                src="/images/hero/hero-hands-on-training.jpg"
                alt="Students in hands-on career training"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 bg-white p-6 sm:p-8">
              <span className="inline-block bg-brand-blue-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full mb-3">
                Most Popular
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                Student Application
              </h2>
              <p className="text-slate-700 mb-3">
                Apply for career training in healthcare, skilled trades, barbering, IT, and more.
                Many programs are funded through WIOA, WRG, and JRI grants. Some programs
                have tuition with flexible payment options available.
              </p>
              <ul className="text-slate-600 text-sm space-y-1 mb-4 list-disc list-inside">
                <li>Register at indianacareerconnect.com for funding</li>
                <li>Pick your program during the application</li>
                <li>Payment plans and BNPL options for paid programs</li>
                <li>Response within 1-2 business days</li>
              </ul>
              <span className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg group-hover:gap-3 transition-all text-sm">
                Apply Now <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </Link>

        {/* Secondary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">

          {/* Employer */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="relative h-[200px]">
              <Image
                src="/images/heroes/career-services.jpg"
                alt="Employer partnership meeting"
                fill
                className="object-cover"
              />
            </div>
            <div className="bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-slate-900">Employer Partnership</h2>
                <Image src="/logo.png" alt="Elevate" width={18} height={18} className="opacity-30" />
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-2">
                Partner with Elevate to access pre-screened, trained candidates ready to work.
                We handle recruiting, skills training, and onboarding so you get job-ready hires.
              </p>
              <p className="text-slate-700 text-sm font-semibold mb-2">Available grants and tax credits:</p>
              <div className="space-y-1.5 mb-3">
                <Link href="/employer" className="block text-sm text-brand-blue-600 hover:text-brand-blue-800 hover:underline">
                  <strong>WOTC</strong> — Work Opportunity Tax Credit up to $9,600 per hire
                </Link>
                <Link href="/ojt-and-funding" className="block text-sm text-brand-blue-600 hover:text-brand-blue-800 hover:underline">
                  <strong>OJT</strong> — On-the-Job Training reimbursement covers 50-75% of wages
                </Link>
                <Link href="/funding" className="block text-sm text-brand-blue-600 hover:text-brand-blue-800 hover:underline">
                  <strong>WIOA</strong> — Workforce Innovation and Opportunity Act funds upskilling
                </Link>
                <Link href="/funding" className="block text-sm text-brand-blue-600 hover:text-brand-blue-800 hover:underline">
                  <strong>WRG</strong> — Workforce Ready Grant covers high-demand certifications
                </Link>
              </div>
              <Link href="/employer" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-brand-blue-700 transition-colors">
                Partner With Us <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Program Holder — full image CTA */}
          <Link
            href="/apply/program-holder"
            className="block rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow group relative"
          >
            <div className="relative h-[320px] sm:h-[360px]">
              <Image
                src="/images/heroes/hero-students.jpg"
                alt="Launch your own training program with Elevate"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Become a Program Holder</h2>
                <p className="text-white text-sm leading-relaxed mb-3">
                  Launch your own workforce training program on Elevate&apos;s platform.
                  We provide the LMS, curriculum, and compliance infrastructure.
                </p>
                <span className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg text-sm group-hover:gap-3 transition-all">
                  Get Started <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Support Bundle */}
        <div className="bg-slate-50 rounded-2xl p-6 sm:p-10 border border-slate-100">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 text-center">
            Every Applicant Gets a Support Bundle
          </h2>
          <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">
            Training is just the start. We wrap services around you so nothing gets in the way of finishing.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                image: '/images/heroes/hero-federal-funding.jpg',
                alt: 'Funding assistance',
                title: 'Funding & Grants',
                desc: 'WIOA covers tuition, books, and supplies for qualifying adults and dislocated workers. WRG (Workforce Ready Grant) funds high-demand certifications in Indiana. JRI (Justice Reinvestment Initiative) supports individuals with justice involvement.',
                link: '/funding',
                linkLabel: 'View Funding Options',
              },

              {
                image: '/images/hero/hero-early-childhood.jpg',
                alt: 'Childcare support',
                title: 'Childcare Support',
                desc: 'Referrals and assistance finding affordable childcare during training hours.',
              },
              {
                image: '/images/career-services/job-fair.jpg',
                alt: 'Career placement services',
                title: 'Career Placement',
                desc: 'Resume help, interview prep, and direct employer connections before you graduate.',
                link: '/career-services',
                linkLabel: 'View Career Services',
              },
              {
                image: '/images/efh/sections/coaching.jpg',
                alt: 'Case management team',
                title: 'Case Management',
                desc: 'A dedicated advisor checks in weekly to help you stay on track.',
              },
              {
                image: '/images/barber/training.jpg',
                alt: 'Barber apprenticeship training in a real barbershop',
                title: 'Barber Apprenticeship',
                desc: 'Train in a real barbershop, earn while you learn, and get your Indiana barber license. 2,000 hours of hands-on experience.',
              },
              {
                image: '/images/hero/hero-certifications.jpg',
                alt: 'Credential and certification support',
                title: 'Credential Support',
                desc: 'Exam prep, testing fees, and licensing assistance included with your program.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl overflow-hidden border border-slate-100">
                <div className="relative h-32 sm:h-36">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  {'link' in item && item.link && (
                    item.link.startsWith('http') ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm mt-3 hover:bg-brand-blue-700 transition-colors"
                      >
                        {('linkLabel' in item && item.linkLabel) || 'Learn More'} <ArrowRight className="w-4 h-4" />
                      </a>
                    ) : (
                      <Link
                        href={item.link}
                        className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm mt-3 hover:bg-brand-blue-700 transition-colors"
                      >
                        {('linkLabel' in item && item.linkLabel) || 'Learn More'} <ArrowRight className="w-4 h-4" />
                      </Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Track existing application */}
        <div className="text-center pt-2">
          <p className="text-slate-500 text-sm">
            Already applied?{' '}
            <Link href="/apply/track" className="text-brand-blue-600 hover:underline font-medium">
              Track your application status
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
