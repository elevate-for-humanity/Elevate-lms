import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

import { TEAM } from '@/data/team';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'About Us | Our Story | Elevate for Humanity',
  description: 'Learn about Elevate for Humanity - a nonprofit workforce development organization providing free career training in Indianapolis, Indiana. Founded by Elizabeth Greene.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'About Us' }]} />
        </div>
      </div>

      {/* HERO — image only, no text overlay */}
      <section className="relative h-[40vh] sm:h-[50vh] min-h-[300px] sm:min-h-[400px]">
        <Image
          src="/images/heroes-hq/about-hero.jpg"
          alt="Elevate for Humanity"
          fill
          quality={90}
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
      </section>

      {/* LOGO + ORG NAME */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Image
            src="/logo.png"
            alt="Elevate for Humanity"
            width={120}
            height={120}
            className="mx-auto mb-6"
          />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Elevate for Humanity
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            A nonprofit workforce development organization providing free career training
            in Indianapolis, Indiana. Founded in 2019 by Elizabeth Greene.
          </p>
        </div>
      </section>

      {/* MISSION */}
      <section id="mission" className="py-10 sm:py-12 md:py-16 bg-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Our Mission</h2>
          <p className="text-base sm:text-lg md:text-xl text-red-100 leading-relaxed">
            To create pathways out of poverty and into prosperity by providing free, high-quality
            career training to justice-involved individuals, low-income families, veterans, and
            anyone facing barriers to employment.
          </p>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">What We Do</h2>
          <div className="space-y-4 text-slate-700 leading-relaxed">
            <p>
              Elevate for Humanity connects eligible Indiana residents with free career training
              through WIOA (Workforce Innovation and Opportunity Act), the Workforce Ready Grant,
              and JRI (Justice Reinvestment Initiative) funding. We are a U.S. Department of Labor
              Registered Apprenticeship Sponsor and an Indiana DWD Approved Training Provider listed
              on the Eligible Training Provider List (ETPL).
            </p>
            <p>
              Our programs cover healthcare (CNA, Medical Assistant, Phlebotomy), skilled trades
              (HVAC, Electrical, Welding, Plumbing), CDL trucking, IT and cybersecurity, barbering,
              cosmetology, and CPR/First Aid. Most programs run 4 to 16 weeks and include hands-on
              training, certification exam preparation, and job placement assistance.
            </p>
            <p>
              We also provide supportive services including career counseling, resume building,
              interview preparation, mental health support, housing assistance, and transportation
              help. Our goal is to remove every barrier between a participant and a stable career.
            </p>
          </div>
        </div>
      </section>

      {/* WHO WE SERVE */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Who We Serve</h2>
          <div className="space-y-4 text-slate-700 leading-relaxed">
            <p>
              <strong>Justice-Involved Individuals:</strong> People currently on probation, parole,
              or recently released from incarceration. JRI funding covers training, supplies, and
              supportive services at no cost. We work directly with community corrections and
              reentry programs across Central Indiana.
            </p>
            <p>
              <strong>Low-Income Adults and Dislocated Workers:</strong> Indiana residents who meet
              WIOA income guidelines or are receiving public assistance (SNAP, TANF, Medicaid).
              WIOA funding covers tuition, books, supplies, and in some cases transportation and childcare.
            </p>
            <p>
              <strong>Veterans:</strong> Military veterans transitioning to civilian careers.
              Veterans receive priority enrollment and may qualify for additional funding through
              VA education benefits combined with WIOA.
            </p>
            <p>
              <strong>Career Changers:</strong> Anyone looking to enter a new field. The Workforce
              Ready Grant covers high-demand certification programs for Indiana residents regardless
              of income level.
            </p>
          </div>
        </div>
      </section>

      {/* CREDENTIALS */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">Our Credentials</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image src="/images/partners/usdol.webp" alt="USDOL" fill sizes="160px" quality={90} className="object-contain" />
              </div>
              <div>
                <div className="font-bold text-slate-900">U.S. Department of Labor</div>
                <div className="text-red-600 text-sm">Registered Apprenticeship Sponsor</div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image src="/images/partners/dwd.webp" alt="Indiana DWD" fill sizes="160px" quality={90} className="object-contain" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Indiana DWD</div>
                <div className="text-red-600 text-sm">Approved Training Provider</div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image src="/images/partners/workone.webp" alt="WorkOne" fill sizes="160px" quality={90} className="object-contain" />
              </div>
              <div>
                <div className="font-bold text-slate-900">WorkOne</div>
                <div className="text-red-600 text-sm">Workforce Partner</div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image src="/images/partners/nextleveljobs.webp" alt="Next Level Jobs" fill sizes="160px" quality={90} className="object-contain" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Next Level Jobs</div>
                <div className="text-red-600 text-sm">Workforce Ready Grant Provider</div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="text-slate-700 font-bold text-sm">WIOA</span>
              </div>
              <div>
                <div className="font-bold text-slate-900">WIOA</div>
                <div className="text-red-600 text-sm">Eligible Training Provider</div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="text-slate-700 font-bold text-sm">JRI</span>
              </div>
              <div>
                <div className="font-bold text-slate-900">JRI</div>
                <div className="text-red-600 text-sm">Approved Provider</div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="text-slate-700 font-bold text-sm">EmployIndy</span>
              </div>
              <div>
                <div className="font-bold text-slate-900">EmployIndy</div>
                <div className="text-red-600 text-sm">Workforce Partner</div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="text-slate-700 font-bold text-sm">ISBCE</span>
              </div>
              <div>
                <div className="font-bold text-slate-900">Indiana State Board</div>
                <div className="text-red-600 text-sm">Cosmetology &amp; Barber Examiners</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUR TEAM */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Our Team</h2>
            <p className="text-lg text-slate-600">The people behind the mission</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {TEAM.map((member) => (
              <Link
                key={member.id}
                href={`/about/team#member-${member.id}`}
                className="group text-center"
              >
                <div className="relative w-full aspect-square max-w-[240px] mx-auto rounded-xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-shadow">
                  <Image
                    src={member.headshotSrc || '/images/hero-new/hero-10.jpg'}
                    alt={member.name}
                    fill
                    quality={90}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover object-top"
                  />
                </div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">{member.name}</h3>
                <p className="text-slate-600 text-sm mt-1 leading-snug">{member.title}</p>
                <span className="inline-flex items-center gap-1 text-red-600 text-sm font-semibold mt-2 group-hover:gap-2 transition-all">
                  View Bio <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOR PARTNERS */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">For Organizations &amp; Partners</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/store/guides/capital-readiness" className="bg-slate-50 rounded-xl p-6 shadow-sm hover:shadow-md transition border border-slate-200">
              <h3 className="font-semibold text-lg mb-2">Capital Readiness Guide</h3>
              <p className="text-slate-600 text-sm mb-3">Build institutional trust and funding readiness for workforce-aligned organizations.</p>
              <span className="text-red-600 text-sm font-medium">Get the guide →</span>
            </Link>
            <Link href="/partner" className="bg-slate-50 rounded-xl p-6 shadow-sm hover:shadow-md transition border border-slate-200">
              <h3 className="font-semibold text-lg mb-2">Partner With Us</h3>
              <p className="text-slate-600 text-sm mb-3">Become a training provider, employer partner, or community organization.</p>
              <span className="text-red-600 text-sm font-medium">Learn more →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Questions? Contact Us
          </h2>
          <p className="text-red-100 text-lg mb-8">
            Training may be free for eligible Indiana residents.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/programs"
              className="inline-flex items-center bg-white text-red-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-50 transition"
            >
              Explore Programs
            </Link>
            <Link
              href="/apply/student"
              className="inline-flex items-center bg-slate-900 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-800 transition"
            >
              Apply Now <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
