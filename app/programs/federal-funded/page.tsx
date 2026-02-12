// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import Link from 'next/link';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import Image from 'next/image';
import { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/server';
import { programs } from '@/app/data/programs';
import { Shield, CheckCircle, Users, Award } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


export const metadata: Metadata = {
  title: 'Federal Funded Programs | WIOA & WRG | Elevate for Humanity',
  description:
    'Free training for eligible participants funded by WIOA, WRG, and federal grants. Medical Assistant, CDL, Healthcare, and more. No cost to you.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/federal-funded',
  },
};

// Note: CNA is self-pay, not federally funded
const federalFundedSlugs = [
  'medical-assistant',
  'phlebotomy-technician',
  'home-health-aide',
  'direct-support-professional',
  'cdl-training',
];

export default async function FederalFundedProgramsPage() {
  const supabase = createPublicClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch federal funded programs
  const { data: dbPrograms } = await supabase
    .from('programs')
    .select('*')
    .eq('funding_type', 'federal');

  const federalPrograms = programs.filter((p) =>
    federalFundedSlugs.includes(p.slug)
  );

  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Federal Funded Programs' },
        ]}
      />
      {/* Hero */}
      <section className="bg-white text-white px-6 sm:px-10 lg:px-12 py-20 lg:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-semibold">
              Federal Funded Programs
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
            Funded Training.
            <br />
            Zero Cost to You.
          </h1>

          <p className="text-xl sm:text-2xl text-green-100 leading-relaxed max-w-3xl mx-auto">
            These programs are fully funded by WIOA (Workforce Innovation and
            Opportunity Act), ETPL (Eligible Training Provider List), and WRG
            (Workforce Ready Grant). You pay nothing.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-black text-center leading-tight mb-12">
            How Federal Funding Works
          </h2>

          <div className="space-y-6 text-lg text-black leading-relaxed">
            <p>
              The federal government recognizes that workforce development is
              essential for economic growth. That's why programs like WIOA
              exist—to remove financial barriers and help people access the
              training they need to succeed.
            </p>

            <p>
              <span className="font-bold text-black">
                You don't pay tuition.
              </span>{' '}
              Federal and state workforce boards cover 100% of your training
              costs. This includes instruction, materials, certifications, and
              sometimes even transportation or childcare assistance.
            </p>

            <p>
              These aren't loans—there's nothing to pay back. The investment is
              in you, because when you succeed, your community succeeds. You get
              a better job, earn more money, and contribute to the economy.
            </p>

            <p className="text-xl font-bold text-black">
              This is public investment in your future. Take advantage of it.
            </p>
          </div>
        </div>
      </section>

      {/* Funding Programs */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-black text-center mb-12">
            Federal Funding Sources
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl border-2 border-green-200 p-8">
              <h3 className="text-2xl font-bold text-black mb-4">WIOA</h3>
              <p className="text-black mb-4">
                Workforce Innovation and Opportunity Act provides funding for
                job training and employment services.
              </p>
              <Link
                href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer"
                className="text-brand-green-600 font-semibold hover:underline"
              >
                Register at Indiana Career Connect →
              </Link>
            </div>

            <div className="bg-white rounded-xl border-2 border-green-200 p-8">
              <h3 className="text-2xl font-bold text-black mb-4">ETPL</h3>
              <p className="text-black mb-4">
                Eligible Training Provider List certifies quality training
                programs approved for federal funding.
              </p>
              <Link
                href="/funding"
                className="text-brand-green-600 font-semibold hover:underline"
              >
                Learn More →
              </Link>
            </div>

            <div className="bg-white rounded-xl border-2 border-green-200 p-8">
              <h3 className="text-2xl font-bold text-black mb-4">WRG</h3>
              <p className="text-black mb-4">
                Workforce Ready Grant supports training in high-demand
                occupations with employer partnerships.
              </p>
              <Link
                href="/funding"
                className="text-brand-green-600 font-semibold hover:underline"
              >
                Learn More →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-black text-center mb-12">
            What's Covered
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green-100 text-brand-green-600 mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-black mb-2">Tuition</h3>
              <p className="text-black">100% of training costs covered</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-brand-blue-600 mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-black mb-2">Certifications</h3>
              <p className="text-black">
                Exam fees and credentials included
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-black mb-2">Support Services</h3>
              <p className="text-black">
                Career counseling and job placement
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-brand-orange-600 mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-black mb-2">No Payback</h3>
              <p className="text-black">Not a loan—nothing to repay</p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-black text-center mb-12">
            Available Programs
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {federalPrograms.map((program: any) => (
              <Link
                key={program.slug}
                href={`/programs/${program.slug}`}
                className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    priority
                    src={program.heroImage}
                    alt={program.heroImageAlt}
                    fill sizes="100vw"
                    sizes="100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-black mb-2">
                    {program.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-2 bg-brand-green-100 text-green-700 text-xs font-semibold rounded-full">
                      {program.duration}
                    </span>
                    <span className="px-3 py-2 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      $0 Cost
                    </span>
                  </div>
                  <span className="inline-flex items-center font-semibold text-brand-green-600 group-hover:underline text-sm">
                    Learn More →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials & Outcomes */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <CredentialsOutcomes
            programName="Federal-Funded Programs"
            partnerCertifications={[
              'Industry certifications based on chosen career pathway',
              'State licenses where applicable',
              'Nationally recognized credentials',
            ]}
            employmentOutcomes={[
              'Employment in high-demand industries',
              'Career pathway to family-sustaining wages',
              'Foundation for career advancement',
              'Access to employer partnerships',
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-6">
            Ready to Start Free Training?
          </h2>
          <p className="text-xl text-black mb-8">
            Apply now to see if you qualify for federal funding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex px-8 py-4 bg-brand-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition text-lg"
            >
              Apply Now
            </Link>
            <Link
              href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex px-8 py-4 bg-white border-2 border-brand-green-600 text-brand-green-600 font-bold rounded-lg hover:bg-white transition text-lg"
            >
              Register at Indiana Career Connect
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
