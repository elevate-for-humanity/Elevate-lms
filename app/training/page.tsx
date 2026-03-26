
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/training' },
  title: 'Training Programs | Elevate For Humanity',
  description:
    'Career training in healthcare, skilled trades, technology, CDL, barbering, and business. Most programs available at no cost to eligible Indiana residents through WIOA and state funding.',
};

const PROGRAM_AREAS = [
  {
    title: 'Healthcare',
    desc: 'CNA, Medical Assistant, Phlebotomy, Peer Recovery Specialist. State and national certifications.',
    href: '/programs/healthcare',
    image: '/images/pages/cna-patient-care.jpg',
    credential: 'Indiana CNA License · PTCB CPhT',
    duration: '4–16 weeks',
  },
  {
    title: 'Skilled Trades',
    desc: 'HVAC, Electrical, Welding, Plumbing, CDL, Diesel Mechanic. Hands-on training with real equipment.',
    href: '/programs/skilled-trades',
    image: '/images/pages/hvac-unit.jpg',
    credential: 'EPA 608 · OSHA · CDL Class A',
    duration: '3–12 weeks',
  },
  {
    title: 'Technology',
    desc: 'IT Help Desk, Cybersecurity, Web Development, Network Administration. Industry certifications.',
    href: '/programs/technology',
    image: '/images/pages/it-helpdesk-desk.jpg',
    credential: 'CompTIA A+ · Security+ · Network+',
    duration: '6–12 weeks',
  },
  {
    title: 'CDL & Transportation',
    desc: 'Class A CDL training for commercial driving careers. One of the fastest paths to a $60K+ job.',
    href: '/programs/cdl-training',
    image: '/images/pages/cdl-truck-highway.jpg',
    credential: 'CDL Class A License',
    duration: '6 weeks',
  },
  {
    title: 'Barbering & Cosmetology',
    desc: 'DOL-registered apprenticeships in barbering, cosmetology, and nail technology. Earn while you learn.',
    href: '/programs/barber-apprenticeship',
    image: '/images/pages/barber-hero-main.jpg',
    credential: 'Indiana Barber / Cosmetology License',
    duration: '20–52 weeks',
  },
  {
    title: 'Business & Professional',
    desc: 'Tax Preparation, Bookkeeping, Office Administration, Entrepreneurship. IRS and Certiport credentials.',
    href: '/programs/business',
    image: '/images/pages/bookkeeping-ledger.jpg',
    credential: 'IRS PTIN · QuickBooks Certified User',
    duration: '5–8 weeks',
  },
];

const INCLUDED = [
  {
    title: 'Industry Certification',
    desc: 'Every program prepares you for a nationally or state-recognized credential issued by the certifying body — not just a course completion certificate.',
  },
  {
    title: 'Hands-On Training',
    desc: 'You learn by doing. Labs, clinical rotations, shop time, and real equipment — not just slides and videos.',
  },
  {
    title: 'Career Placement Support',
    desc: 'Resume help, interview preparation, and direct connections to employer partners in your field.',
  },
  {
    title: 'Funding Navigation',
    desc: 'We help you identify WIOA, WRG, JRI, and other funding sources. Eligibility is determined through WorkOne.',
  },
];

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Training Programs' }]} />
        </div>
      </div>

      {/* Hero — clean image, no text overlay */}
      <section className="relative h-[45vh] min-h-[280px] max-h-[560px] w-full overflow-hidden">
        <Image
          src="/images/pages/training-page-3.jpg"
          alt="Career training programs at Elevate for Humanity"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </section>

      {/* Page identity — below hero */}
      <section className="border-b border-slate-100 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">
            Indianapolis, Indiana
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
            Training Programs
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
            Hands-on career training in high-demand fields. Most programs are available at no cost
            to eligible Indiana residents through WIOA and state funding.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/programs"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              See All Programs
            </Link>
            <Link
              href="/wioa-eligibility"
              className="border-2 border-slate-300 hover:border-brand-blue-400 text-slate-700 font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Check Funding Eligibility
            </Link>
          </div>
        </div>
      </section>

      {/* Program areas — real images, no icons as content */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Career Pathways
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Choose Your Career Path
            </h2>
            <p className="text-slate-600 text-base mt-2 max-w-2xl leading-relaxed">
              Each pathway leads to a specific credential and job title. Click any area to see
              individual programs, schedules, and enrollment options.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROGRAM_AREAS.map((area) => (
              <Link
                key={area.title}
                href={area.href}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={area.image}
                    alt={area.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{area.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">{area.desc}</p>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Duration:</span> {area.duration}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Credentials:</span> {area.credential}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What every program includes */}
      <section className="py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Every Program
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              What Every Program Includes
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {INCLUDED.map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding clarity */}
      <section className="py-14 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-8 items-start">
            <div>
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
                Funding & Payment
              </p>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-4">
                How Training Gets Paid For
              </h2>
              <p className="text-slate-600 text-base leading-relaxed mb-4">
                Federal and state funding covers tuition, tools, and certification fees for eligible
                participants. Eligibility is determined through WorkOne — not Elevate.
              </p>
              <p className="text-slate-600 text-base leading-relaxed mb-6">
                For WIOA-eligible and apprenticeship pathway applicants, the next step may require
                Indiana Career Connect. Students who do not qualify for funding can enroll through
                flexible self-pay and buy-now-pay-later options.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/funding"
                  className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Explore Funding Options
                </Link>
                <a
                  href="https://www.indianacareerconnect.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Go to Indiana Career Connect
                </a>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'WIOA', desc: 'Federal funding for adults, dislocated workers, and youth. Covers tuition, books, and support services.' },
                { label: 'Workforce Ready Grant (WRG)', desc: 'Indiana state grant for high-demand certificate programs. No repayment required.' },
                { label: 'JRI (Justice Reinvestment Initiative)', desc: 'Funding for justice-involved individuals. Covers training and support services.' },
                { label: 'Self-Pay / BNPL', desc: 'Flexible payment plans and buy-now-pay-later options for students who do not qualify for funding.' },
              ].map((f) => (
                <div key={f.label} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <p className="font-bold text-slate-900 text-sm mb-1">{f.label}</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">Ready to Start Training?</h2>
          <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-xl mx-auto">
            Apply in minutes. Attend an orientation to learn about programs and check your eligibility
            for funded training.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/start"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-10 py-4 rounded-xl transition-colors text-base w-full sm:w-auto"
            >
              Apply Now
            </Link>
            <Link
              href="/programs"
              className="border-2 border-slate-600 hover:border-slate-400 text-white font-bold px-10 py-4 rounded-xl transition-colors text-base w-full sm:w-auto"
            >
              Browse All Programs
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
