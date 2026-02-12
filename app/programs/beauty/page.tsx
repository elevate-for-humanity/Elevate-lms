// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import Link from 'next/link';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import PageAvatar from '@/components/PageAvatar';
import Image from 'next/image';
import { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/server';
import ModernLandingHero from '@/components/landing/ModernLandingHero';
import { ArrowRight, Clock, DollarSign, Award, CheckCircle } from 'lucide-react';
import { HostShopRequirements } from '@/components/compliance/HostShopRequirements';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


export const metadata: Metadata = {
  title: 'Beauty Industry Apprenticeships | Barber, Cosmetology, Esthetics, Nails',
  description:
    'DOL-registered apprenticeship programs in barbering, cosmetology, esthetics, and nail technology. Earn while you learn with flat-fee pricing. ETPL approved.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/beauty',
  },
};

const beautyPrograms = [
  {
    title: 'Barber Apprenticeship',
    description: 'Complete 2,000-hour apprenticeship to become a licensed barber in Indiana. Learn cutting, styling, shaving, and business skills.',
    href: '/programs/barber-apprenticeship',
    image: '/hero-images/barber-hero.jpg',
    hours: 2000,
    price: 4980,
    duration: '15-24 months',
    highlights: ['Indiana IPLA compliant', 'Milady Theory included', 'Hour logging system'],
  },
  {
    title: 'Cosmetology Apprenticeship',
    description: 'Full cosmetology training covering hair, skin, and nails. 1,500-hour program prepares you for state licensure.',
    href: '/programs/cosmetology-apprenticeship',
    image: '/images/beauty/hero-program-cosmetology.jpg',
    hours: 1500,
    price: 4980,
    duration: '12-18 months',
    highlights: ['Complete beauty training', 'Hair, skin & nails', 'State license prep'],
  },
  {
    title: 'Esthetician Apprenticeship',
    description: 'Specialize in skincare with 700 hours of training. Learn facials, treatments, and advanced skin techniques.',
    href: '/programs/esthetician-apprenticeship',
    image: '/hero-images/barber-beauty-category.jpg',
    hours: 700,
    price: 3480,
    duration: '6-9 months',
    highlights: ['Skincare specialty', 'Facial techniques', 'Treatment protocols'],
  },
  {
    title: 'Nail Technician Apprenticeship',
    description: 'Master nail artistry with 450 hours of training. Learn manicures, pedicures, acrylics, and nail art.',
    href: '/programs/nail-technician-apprenticeship',
    image: '/hero-images/barber-beauty-category.webp',
    hours: 450,
    price: 2980,
    duration: '4-6 months',
    highlights: ['Nail artistry', 'Acrylics & gels', 'Salon business skills'],
  },
];

export default async function BeautyProgramsPage() {
  const supabase = createPublicClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch beauty programs
  const { data: dbBeautyPrograms } = await supabase
    .from('programs')
    .select('*')
    .eq('category', 'beauty');

  return (
    <div className="pb-20 md:pb-0">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Beauty' },
        ]}
      />
      <ModernLandingHero
        badge="DOL Registered Apprenticeships"
        headline="Beauty Industry Apprenticeships"
        accentText="Earn While You Learn"
        subheadline="Barber • Cosmetology • Esthetics • Nails"
        description="Launch your career in the beauty industry with our DOL-registered apprenticeship programs. Flat-fee pricing, no hidden costs. Work with licensed professionals while completing your training hours."
        imageSrc="/hero-images/barber-beauty-category.jpg"
        imageAlt="Beauty Industry Training"
        primaryCTA={{ text: 'View Programs', href: '#programs' }}
        secondaryCTA={{ text: 'Apply Now', href: '/apply' }}
        features={[
          'DOL Registered & ETPL Approved',
          'Flat-fee pricing - no hourly charges',
          'Earn income while training',
        ]}
        imageOnRight={true}
      />

      {/* Why Apprenticeship */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-black mb-4">Why Choose an Apprenticeship?</h2>
            <p className="text-xl text-gray-600">
              Apprenticeships offer a proven path to licensure with real-world experience
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">Earn While Learning</h3>
              <p className="text-gray-600 text-sm">
                Work in a salon and earn income while completing your training hours
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">Flexible Schedule</h3>
              <p className="text-gray-600 text-sm">
                Complete hours at your own pace while working with your sponsor
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">State Licensure</h3>
              <p className="text-gray-600 text-sm">
                Programs meet state requirements for professional licensure
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <CheckCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">DOL Registered</h3>
              <p className="text-gray-600 text-sm">
                Official Department of Labor registered apprenticeship programs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pathway Disclosure */}
      <PathwayDisclosure programName="Beauty" programSlug="beauty" />

      {/* Program Cards */}
      <section id="programs" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-black mb-4">Choose Your Program</h2>
            <p className="text-xl text-gray-600">
              All programs include theory materials, hour logging, and career support
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {beautyPrograms.map((program) => (
              <Link
                key={program.href}
                href={program.href}
                className="group block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 hover:border-gray-900 overflow-hidden"
              >
                <div className="relative w-full h-48 overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.title}
                    fill sizes="100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-full">
                    <span className="text-sm font-bold text-gray-900">
                      ${program.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-black mb-2">{program.title}</h3>
                  <p className="text-gray-600 mb-4">{program.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {program.hours} hours
                    </span>
                    <span>{program.duration}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {program.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-xs"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center text-brand-blue-600 font-semibold group-hover:text-brand-blue-700">
                    Learn More <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
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

      {/* Important Notice */}
      <section className="py-12 bg-white border-y border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-bold text-amber-800 mb-4">Important Notice</h3>
            <p className="text-amber-700">
              These apprenticeship programs are NOT a substitute for licensed cosmetology, barber,
              esthetician, or nail technician schools. Apprenticeships are an alternative pathway to
              licensure that requires working under a licensed sponsor. You must secure a sponsor
              before beginning your apprenticeship hours.
            </p>
          </div>
        </div>
      </section>

      {/* Credentials & Outcomes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <CredentialsOutcomes
            programName="Beauty & Cosmetology"
            partnerCertifications={[
              'Indiana Cosmetology License (issued by Indiana Professional Licensing Agency)',
              'Indiana Barber License (issued by Indiana Professional Licensing Agency)',
              'Indiana Esthetician License (issued by Indiana Professional Licensing Agency)',
              'Indiana Manicurist License (issued by Indiana Professional Licensing Agency)',
            ]}
            employmentOutcomes={[
              'Licensed Cosmetologist',
              'Licensed Barber',
              'Licensed Esthetician',
              'Licensed Nail Technician',
              'Salon/Barbershop Owner',
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Link
            href="/apply"
            className="inline-block bg-brand-blue-600 rounded-2xl px-8 py-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105 transform"
          >
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
              Ready to Start Your Beauty Career?
            </h3>
            <p className="text-white/90 mb-4">Check eligibility first - takes just 5 minutes</p>
            <div className="inline-flex items-center gap-2 text-white font-bold">
              <span>Start Eligibility & Choose This Program</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
