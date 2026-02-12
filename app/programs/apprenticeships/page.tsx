// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import Link from 'next/link';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import Image from 'next/image';
import { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/server';
import { programs } from '@/app/data/programs';
import { Briefcase, Clock, DollarSign, Award } from 'lucide-react';
import { HostShopRequirements } from '@/components/compliance/HostShopRequirements';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


export const metadata: Metadata = {
  title:
    'Apprenticeship Programs | Earn While You Learn | Elevate for Humanity',
  description:
    'DOL-registered apprenticeship programs in Indiana. Get paid while you learn. Barber, HVAC, Building Maintenance, and more. No debt, real wages.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/apprenticeships',
  },
};

const apprenticeshipSlugs = [
  'barber-apprenticeship',
  'hvac-technician',
  'building-maintenance',
  'building-technician',
];

export default async function ApprenticeshipProgramsPage() {
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
  
  // Fetch apprenticeship programs
  const { data: dbApprenticeships } = await supabase
    .from('programs')
    .select('*')
    .eq('type', 'apprenticeship');

  const apprenticeships = programs.filter((p) =>
    apprenticeshipSlugs.includes(p.slug)
  );

  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Apprenticeships' },
        ]}
      />
      {/* Hero */}
      <section className="bg-white text-white px-6 sm:px-10 lg:px-12 py-20 lg:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Briefcase className="w-5 h-5" />
            <span className="text-sm font-semibold">
              Apprenticeship Programs
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
            Earn While You Learn
          </h1>

          <p className="text-xl sm:text-2xl text-blue-100 leading-relaxed max-w-3xl mx-auto">
            Get paid to train in a skilled trade. Apprenticeships combine
            hands-on work experience with classroom instruction—and you earn a
            paycheck from day one.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-black text-center leading-tight mb-12">
            Why Apprenticeships Work
          </h2>

          <div className="space-y-6 text-lg text-black leading-relaxed">
            <p>
              Traditional education asks you to pay tuition and wait years
              before earning a real income. Apprenticeships flip that model—you
              get paid while you learn, gaining real-world experience from day
              one.
            </p>

            <p>
              <span className="font-bold text-black">
                You're not just a student—you're an employee.
              </span>{' '}
              You work alongside experienced professionals, learning the trade
              through hands-on practice. Your employer pays you a wage that
              increases as your skills grow.
            </p>

            <p>
              By the time you complete your apprenticeship, you have years of
              experience, industry certifications, and zero student debt. You're
              ready to command top wages in your field.
            </p>

            <p className="text-xl font-bold text-black">
              This is how skilled trades have been taught for centuries—and it
              still works better than anything else.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-black text-center mb-12">
            Apprenticeship Benefits
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-brand-blue-600 mb-4">
                <DollarSign className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-black mb-2">Get Paid</h3>
              <p className="text-black">
                Earn a wage from day one, with increases as you progress
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green-100 text-brand-green-600 mb-4">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-black mb-2">Real Experience</h3>
              <p className="text-black">
                Work on actual projects, not just classroom exercises
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-black mb-2">Certifications</h3>
              <p className="text-black">
                Earn industry-recognized credentials as you train
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-brand-orange-600 mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-black mb-2">No Debt</h3>
              <p className="text-black">
                Zero tuition costs—you're paid to learn
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-black text-center mb-12">
            Available Apprenticeships
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {apprenticeships.map((program: any) => (
              <Link
                key={program.slug}
                href={`/programs/${program.slug}`}
                className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="relative h-64 w-full overflow-hidden">
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
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-black mb-3">
                    {program.name}
                  </h3>
                  <p className="text-black mb-4 leading-relaxed">
                    {program.shortDescription}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                      {program.duration}
                    </span>
                    <span className="px-3 py-2 bg-brand-green-100 text-green-700 text-sm font-semibold rounded-full">
                      Paid Training
                    </span>
                  </div>
                  <span className="inline-flex items-center font-semibold text-brand-blue-600 group-hover:underline">
                    Learn More →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Host Shop Requirements - All Tracks */}
      <HostShopRequirements 
        programTrack="all" 
        showApprovalProcess={true}
        showMultiRegion={true}
      />

      {/* Credentials & Outcomes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <CredentialsOutcomes
            programName="Apprenticeship"
            partnerCertifications={[
              'USDOL Registered Apprenticeship Certificate of Completion',
              'State Professional License (issued by Indiana Professional Licensing Agency)',
              'Industry-specific certifications as required by trade',
            ]}
            employmentOutcomes={[
              'Licensed Professional in your trade',
              'Journeyman status',
              'Business Owner/Operator',
              'Trade Instructor',
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 sm:px-10 lg:px-12 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-6">
            Ready to Start Your Apprenticeship?
          </h2>
          <p className="text-xl text-black mb-8">
            Apply now and start earning while you learn a skilled trade.
          </p>
          <Link
            href="/apply"
            className="inline-flex px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition text-lg"
          >
            Apply Now
          </Link>
        </div>
      </section>
    </div>
  );
}
