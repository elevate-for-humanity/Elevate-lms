import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/founder' },
  title: 'Elizabeth Greene - Founder | Elevate For Humanity',
  description:
    'Elizabeth Greene is a U.S. Army veteran (Unit Supply Specialist), IRS Enrolled Agent, licensed barber, and the founder of Elevate for Humanity Career & Technical Institute in Indianapolis.',
};

export default function FounderPage() {
  return (
    <div className="min-h-screen bg-white">      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Founder' }]} />
      </div>

      {/* Hero */}
      <section className="relative h-[280px] sm:h-[360px] overflow-hidden">
        <Image src="/images/pages/admin-audit-logs-hero.jpg" alt="Elevate for Humanity founder" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 flex items-center px-6">
          <div className="max-w-6xl mx-auto w-full">
            <p className="text-brand-red-400 font-bold text-xs uppercase tracking-widest mb-2">Founder &amp; CEO</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900">Elizabeth Greene</h1>
            <p className="text-slate-600 text-lg mt-2">Elevate for Humanity Career &amp; Technical Institute</p>
          </div>
        </div>
      </section>

      {/* Bio — full body photo left, bio right */}
      <section className="py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-start">

            {/* Founder hero photo */}
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/team/founder/elizabeth-greene-founder-hero-01.jpg"
                alt="Elizabeth Greene, Founder and CEO of Elevate for Humanity"
                fill
                className="object-cover object-top"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Bio */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-1">Elizabeth Greene</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-1">Founder & Chief Executive Officer</p>
              <p className="text-slate-500 text-sm mb-8">Elevate for Humanity Career & Technical Institute · Indianapolis, IN</p>

              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>
                  Elizabeth Greene is a U.S. Army veteran (Unit Supply Specialist) and the founder of Elevate for Humanity
                  Career & Technical Institute — a workforce development organization in Indianapolis
                  serving justice-involved individuals, low-income families, veterans, and anyone
                  facing barriers to employment.
                </p>

                <p>
                  She is an IRS Enrolled Agent (EA) with both an EFIN and PTIN, authorized to
                  represent taxpayers before the Internal Revenue Service at all administrative
                  levels. She holds an Indiana Barber License through the Indiana Professional
                  Licensing Agency, an Indiana Substitute Teacher License, and is OSHA 10-Hour
                  Safety certified.
                </p>

                <p>
                  Elizabeth is a nationally authorized EPA Section 608 proctor through both the
                  ESCO Group (Proctor ID: 358010) and Mainstream Engineering — one of the few
                  training providers in Indiana authorized by both certifying bodies. She also
                  operates a Certiport Authorized Testing Center (CATC) for Microsoft Office
                  Specialist, IC3, and IT Specialist credentials.
                </p>

                <p>
                  Under her leadership, Elevate has secured approvals across federal, state, and
                  local agencies: U.S. DOL Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301),
                  Indiana ETPL listed, Workforce Ready Grant (WRG) approved, WIOA and Job Ready Indy funding
                  approved, and Job Ready Indy partner. Elevate is enrolled in PECOS with an NPI,
                  is SAM.gov registered as a federal government contractor, ITAP/INDOT registered,
                  and ByBlack certified through the U.S. Black Chambers / NAACP.
                </p>

                <p>
                  Elizabeth also founded SupersonicFastCash (tax preparation software) and
                  Selfish Inc. — a 501(c)(3) nonprofit operating as The Rise Foundation — providing
                  mental wellness counseling, body sculpting services, VITA free tax preparation,
                  and community support programs across Indianapolis.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/programs" className="inline-flex items-center bg-brand-red-600 text-white px-6 py-3 rounded-full font-bold hover:bg-brand-red-700 transition">
                  Explore Programs <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link href="/contact" className="inline-flex items-center border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-full font-bold hover:border-slate-400 transition">
                  Schedule a Meeting
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials — categorized dark section */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">Credentials & Approvals</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Personal Licenses */}
            <div>
              <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Personal Licenses</p>
              <ul className="space-y-2">
                {[
                  'U.S. Army Veteran',
                  'IRS Enrolled Agent (EA)',
                  'EFIN Holder',
                  'PTIN Holder',
                  'Indiana Barber License — IN PLA',
                  'Indiana Substitute Teacher License',
                  'OSHA 10-Hour Safety Certified',
                ].map((c) => (
                  <li key={c} className="flex items-start gap-2 text-slate-600 text-sm">
                    <span className="text-brand-red-400 mt-0.5">▸</span>{c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Testing & Proctoring */}
            <div>
              <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Testing & Proctoring</p>
              <ul className="space-y-2">
                {[
                  'EPA 608 Proctor — ESCO Group (#358010)',
                  'EPA 608 Proctor — Mainstream Engineering',
                  'Certiport Authorized Testing Center (CATC)',
                  'Microsoft Office Specialist Proctor',
                  'IC3 Digital Literacy Proctor',
                  'IT Specialist Proctor',
                ].map((c) => (
                  <li key={c} className="flex items-start gap-2 text-slate-600 text-sm">
                    <span className="text-brand-red-400 mt-0.5">▸</span>{c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Federal & State Approvals */}
            <div>
              <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Federal & State Approvals</p>
              <ul className="space-y-2">
                {[
                  'DOL Apprenticeship Sponsor — RAPIDS 2025-IN-132301',
                  'Indiana ETPL Listed Provider',
                  'Workforce Ready Grant (WRG) Approved',
                  'WIOA Funding Approved',
                  'Job Ready Indy Funding Approved',
                  'Job Ready Indy Partner',
                  'WorkOne Partner',
                  'PECOS / NPI Enrolled',
                  'ITAP / INDOT Registered',
                  'Indiana State Bidder',
                  'SAM.gov Registered — Federal Government Contractor',
                ].map((c) => (
                  <li key={c} className="flex items-start gap-2 text-slate-600 text-sm">
                    <span className="text-brand-red-400 mt-0.5">▸</span>{c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Partners & Certifications */}
            <div>
              <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">Partners & Certifications</p>
              <ul className="space-y-2">
                {[
                  'ByBlack Certified — U.S. Black Chambers / NAACP',
                  'EmployIndy Partner',
                  'WorkOne Partner',
                  'Job Ready Indy Partner',
                  'HSI (Health & Safety Institute) Affiliate',
                  'CareerSafe OSHA Training Provider',
                  'Elevate LMS Curriculum Partner',
                  'NRF Rise Up Provider',
                  'Certiport Authorized Testing Center (CATC)',

                  'Selfish Inc. — 501(c)(3) Nonprofit',
                  'The Rise Foundation (DBA of Selfish Inc.) — VITA Free Tax Prep',
                  'SupersonicFastCash — Tax Software',
                ].map((c) => (
                  <li key={c} className="flex items-start gap-2 text-slate-600 text-sm">
                    <span className="text-brand-red-400 mt-0.5">▸</span>{c}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-14 border-y border-slate-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <blockquote className="text-xl sm:text-2xl text-slate-800 italic leading-relaxed">
            &ldquo;Every person — regardless of their past — deserves access to quality education,
            living-wage employment, and the opportunity to build a better future.&rdquo;
          </blockquote>
          <p className="mt-4 text-slate-500 font-semibold">— Elizabeth Greene</p>
        </div>
      </section>

      {/* Organizations */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">Organizations</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                name: 'Elevate for Humanity',
                role: 'Career & Technical Institute',
                desc: 'Workforce training, apprenticeship sponsorship, funding navigation, and employer partnerships. DOL Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301), ETPL listed, WRG, WIOA, and Job Ready Indy approved.',
                href: '/about',
              },
              {
                name: 'Selfish Inc. — The Rise Foundation',
                role: '501(c)(3) Nonprofit · DBA: The Rise Foundation',
                desc: 'IRS-recognized 501(c)(3) nonprofit. The Rise Foundation is the operating DBA of Selfish Inc. Programs include mental wellness counseling, CurvatureBody Sculpting, Meri-Go-Round wellness products, and free VITA tax preparation for Indianapolis families.',
                href: '/rise-foundation',
              },
              {
                name: 'SupersonicFastCash',
                role: 'Tax Preparation Software',
                desc: 'Tax preparation software company. Elizabeth is an IRS Enrolled Agent (EA) with EFIN and PTIN, authorized to represent taxpayers before the IRS at all administrative levels.',
                href: null,
              },
              {
                name: 'Certiport Authorized Testing Center',
                role: 'CATC · EPA 608 Proctor Site',
                desc: 'On-site proctoring for Microsoft Office Specialist, IC3, and IT Specialist credentials. Also an authorized EPA Section 608 proctor site for both ESCO Group (ID: 358010) and Mainstream Engineering.',
                href: '/testing',
              },
            ].map((org) => (
              <div key={org.name} className="border border-slate-200 rounded-xl p-6">
                <p className="text-xs font-semibold text-brand-red-600 uppercase tracking-wider">{org.role}</p>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{org.name}</h3>
                <p className="text-slate-600 text-sm mt-2">{org.desc}</p>
                {org.href && (
                  <Link href={org.href} className="inline-flex items-center gap-1 text-brand-red-600 text-sm font-semibold mt-3 hover:underline">
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Start Your Career</h2>
          <p className="text-slate-600 text-lg mb-8">Explore funded training programs or apply today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/programs" className="inline-flex items-center bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-white transition">
              Explore Programs
            </Link>
            <Link href="/start" className="inline-flex items-center border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition">
              Apply Now <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
