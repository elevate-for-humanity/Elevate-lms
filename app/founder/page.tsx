import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

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

      {/* Hero — clean image, no overlay */}
      <section className="relative h-[340px] sm:h-[420px] overflow-hidden">
        <Image
          src="/images/heroes-hq/about-hero.jpg"
          alt="Elevate for Humanity workforce training"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </section>

      {/* Name + Title bar */}
      <section className="bg-slate-900 py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
            <Image
              src="/images/team/elizabeth-greene.jpg"
              alt="Elizabeth Greene"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Elizabeth Greene</h1>
            <p className="text-brand-red-400 font-semibold">Founder & Chief Executive Officer</p>
            <p className="text-slate-400 text-sm">Elevate for Humanity Career & Technical Institute</p>
          </div>
        </div>
      </section>

      {/* Bio + Photo grid */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-3 text-slate-800 space-y-5 text-[17px] leading-relaxed">
              <p>
                Elizabeth Greene is a U.S. military veteran and the founder of Elevate for Humanity
                Career & Technical Institute. She is an IRS Enrolled Agent (EA) holding both an
                EFIN and PTIN, authorized to represent taxpayers before the Internal Revenue Service.
              </p>
              <p>
                She is a licensed barber through the Indiana Professional Licensing Agency, holds an
                Indiana Substitute Teacher License, and is OSHA 10-Hour Safety certified. She is a
                certified proctor for EPA Section 608 refrigerant handling exams through both the
                ESCO Group and Mainstream Engineering.
              </p>
            </div>
            <div className="lg:col-span-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/team/elizabeth-greene.jpg"
                  alt="Elizabeth Greene"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual break — training image */}
      <section className="relative h-[250px] sm:h-[300px] overflow-hidden">
        <Image
          src="/images/programs-hq/training-classroom.jpg"
          alt="Students in a training classroom"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </section>

      {/* Approvals + Partnerships */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-2">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/heroes-hq/career-services-hero.jpg"
                  alt="Career services and workforce partnerships"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>
            <div className="lg:col-span-3 text-slate-800 space-y-5 text-[17px] leading-relaxed">
              <p>
                Under her leadership, Elevate for Humanity has secured approvals across federal,
                state, and local agencies. The organization is a U.S. Department of Labor Registered
                Apprenticeship Sponsor (RAPIDS: 2025-IN-132301), listed on the Eligible Training
                Provider List (ETPL), and approved as a Workforce Ready Grant (WRG) provider.
              </p>
              <p>
                Elevate is WIOA and JRI funding approved, and partners with EmployIndy, Choice
                Medical CNA School, Milady (cosmetology and barbering curriculum), and the National
                Retail Federation Foundation (NRF Rise Up retail credentials).
              </p>
              <p>
                She also operates a Certiport Authorized Testing Center for industry certifications
                and administers EPA 608 exams on-site through ESCO Group and Mainstream Engineering.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials — compact visual grid */}
      <section className="py-14 sm:py-20 bg-slate-900">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Credentials & Approvals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
              <div key={cred} className="bg-slate-800 rounded-lg px-4 py-3">
                <span className="text-white text-sm font-medium">{cred}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual break — programs image */}
      <section className="relative h-[250px] sm:h-[300px] overflow-hidden">
        <Image
          src="/images/heroes-hq/programs-hero.jpg"
          alt="Workforce training programs"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </section>

      {/* Organizations + registrations */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-3 text-slate-800 space-y-5 text-[17px] leading-relaxed">
              <p>
                Elevate for Humanity is registered as an Indiana State Bidder, holds a federal CAGE
                code for government contracting, and is ITAP/INDOT registered. The organization is
                enrolled in PECOS as a Medicare provider with a National Provider Identifier (NPI)
                and is ByBlack certified through the NAACP as a Black-owned business.
              </p>
              <p>
                Elizabeth also founded SupersonicFastCash, a tax preparation software company, and
                the RISE Foundation, a 501(c)(3) nonprofit providing philanthropic support for
                workforce development initiatives.
              </p>
            </div>
            <div className="lg:col-span-2">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/heroes-hq/funding-hero.jpg"
                  alt="Workforce funding and development"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote — with background image */}
      <section className="relative py-20 overflow-hidden">
        <Image
          src="/images/heroes-hq/success-hero.jpg"
          alt="Student success"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <blockquote className="text-xl sm:text-2xl text-white italic leading-relaxed">
            &ldquo;Every person — regardless of their past — deserves access to quality education,
            living-wage employment, and the opportunity to build a better future.&rdquo;
          </blockquote>
          <p className="mt-4 text-white/70 font-semibold">— Elizabeth Greene</p>
        </div>
      </section>

      {/* Organizations */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">Organizations</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                name: 'Elevate for Humanity',
                role: 'Career & Technical Institute',
                desc: 'Workforce training, apprenticeship sponsorship, funding navigation, and employer partnerships.',
                image: '/images/heroes-hq/how-it-works-hero.jpg',
              },
              {
                name: 'SupersonicFastCash',
                role: 'Tax Preparation Software',
                desc: 'Tax preparation software. Elizabeth is an IRS Enrolled Agent with EFIN and PTIN.',
                image: '/images/heroes-hq/tax-refund-hero.jpg',
              },
              {
                name: 'RISE Foundation',
                role: '501(c)(3) Nonprofit',
                desc: 'Philanthropic support for workforce development. IRS tax-exempt determination July 2024.',
                image: '/images/heroes-hq/success-stories-hero.jpg',
              },
              {
                name: 'Certiport Testing Center',
                role: 'Authorized CATC',
                desc: 'On-site proctoring for Microsoft Office Specialist, IC3, and IT Specialist exams.',
                image: '/images/programs-hq/business-office.jpg',
              },
            ].map((org) => (
              <div key={org.name} className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                <div className="relative h-40">
                  <Image src={org.image} alt={org.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold text-brand-red-600 uppercase tracking-wider">{org.role}</p>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{org.name}</h3>
                  <p className="text-slate-600 text-sm mt-2">{org.desc}</p>
                </div>
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
            <Link href="/apply" className="inline-flex items-center border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition">
              Apply Now <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
