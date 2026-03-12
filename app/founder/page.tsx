import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import VideoHeroBanner from '@/components/ui/VideoHeroBanner';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/founder' },
  title: 'Elizabeth Greene - Founder | Elevate For Humanity',
  description:
    'Elizabeth Greene is a U.S. military veteran, IRS Enrolled Agent, licensed barber, and the founder of Elevate for Humanity Career & Technical Institute in Indianapolis.',
};

export default function FounderPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Founder' }]} />
      </div>

      {/* Video Hero */}
      <VideoHeroBanner videoSrc="/videos/elevate-overview-with-narration.mp4" posterSrc="/images/pages/founder-video-poster.jpg" posterAlt="Founder" />

      {/* Bio — full body photo left, bio right */}
      <section className="py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-start">

            {/* Full body photo */}
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/team/elizabeth-greene.jpg"
                alt="Elizabeth Greene, Founder and CEO of Elevate for Humanity"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Bio */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-1">Elizabeth Greene</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-1">Founder & Chief Executive Officer</p>
              <p className="text-slate-500 text-sm mb-8">Elevate for Humanity Career & Technical Institute</p>

              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>
                  Elizabeth Greene is a U.S. military veteran and the founder of Elevate for Humanity
                  Career & Technical Institute, a workforce development organization in Indianapolis
                  serving justice-involved individuals, low-income families, veterans, and anyone
                  facing barriers to employment.
                </p>

                <p>
                  She is an IRS Enrolled Agent (EA) holding both an EFIN and PTIN, authorized to
                  represent taxpayers before the Internal Revenue Service. She is also a licensed
                  barber through the Indiana Professional Licensing Agency, holds an Indiana
                  Substitute Teacher License, and is OSHA 10-Hour Safety certified.
                </p>

                <p>
                  Elizabeth is a certified proctor for EPA Section 608 refrigerant handling exams
                  through both the ESCO Group and Mainstream Engineering, allowing Elevate to
                  administer EPA certification exams on-site. She also operates a Certiport
                  Authorized Testing Center (CATC) for industry certifications.
                </p>

                <p>
                  Under her leadership, Elevate for Humanity has secured approvals across federal,
                  state, and local agencies. The organization is a U.S. Department of Labor Registered
                  Apprenticeship Sponsor (RAPIDS: 2025-IN-132301), listed on the Eligible Training
                  Provider List (ETPL), and approved as a Workforce Ready Grant (WRG) provider.
                  Elevate is WIOA and JRI funding approved, and partners with EmployIndy, Choice
                  Medical CNA School, Milady, and the National Retail Federation Foundation (NRF Rise Up).
                </p>

                <p>
                  Elevate is enrolled in PECOS as a Medicare provider with a National Provider
                  Identifier (NPI), registered as an Indiana State Bidder with a federal CAGE code,
                  ITAP/INDOT registered, and ByBlack certified through the NAACP.
                </p>

                <p>
                  Elizabeth also founded SupersonicFastCash, a tax preparation software company, and
                  the RISE Foundation, a 501(c)(3) nonprofit providing philanthropic support for
                  workforce development initiatives.
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

      {/* Credentials — compact dark section */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Credentials & Approvals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {[
              'U.S. Military Veteran',
              'IRS Enrolled Agent (EA)',
              'EFIN & PTIN Holder',
              'Licensed Barber — IN PLA',
              'IN Substitute Teacher License',
              'OSHA 10-Hour Certified',
              'EPA 608 Proctor — ESCO Group',
              'EPA 608 Proctor — Mainstream Eng.',
              'DOL Apprenticeship Sponsor',
              'ETPL Listed Provider',
              'WRG Approved',
              'WIOA Approved',
              'JRI Approved',
              'Certiport CATC',
              'Milady Partner',
              'NRF Rise Up Provider',
              'EmployIndy Partner',
              'Choice Medical CNA Partner',
              'PECOS / NPI Enrolled',
              'ITAP / INDOT Registered',
              'Indiana State Bidder',
              'CAGE Code Registered',
              'ByBlack Certified — NAACP',
            ].map((cred) => (
              <div key={cred} className="bg-slate-800 rounded-lg px-3 py-2.5">
                <span className="text-white text-xs font-medium">{cred}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-14 bg-slate-50 border-y border-slate-100">
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
                desc: 'Workforce training, apprenticeship sponsorship, funding navigation, and employer partnerships. DOL Registered Apprenticeship Sponsor, ETPL listed, WRG and WIOA approved.',
              },
              {
                name: 'SupersonicFastCash',
                role: 'Tax Preparation Software',
                desc: 'Tax preparation software company. Elizabeth is an IRS Enrolled Agent with EFIN and PTIN, authorized to represent taxpayers before the IRS.',
              },
              {
                name: 'RISE Foundation',
                role: '501(c)(3) Nonprofit',
                desc: 'Philanthropic support for workforce development initiatives. IRS tax-exempt determination received July 2024.',
              },
              {
                name: 'Certiport Testing Center',
                role: 'Authorized CATC',
                desc: 'On-site proctoring for industry certification exams including Microsoft Office Specialist, IC3, and IT Specialist credentials.',
              },
            ].map((org) => (
              <div key={org.name} className="border border-slate-200 rounded-xl p-6">
                <p className="text-xs font-semibold text-brand-red-600 uppercase tracking-wider">{org.role}</p>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{org.name}</h3>
                <p className="text-slate-600 text-sm mt-2">{org.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start Your Career</h2>
          <p className="text-white/80 text-lg mb-8">Explore funded training programs or apply today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/programs" className="inline-flex items-center bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-100 transition">
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
