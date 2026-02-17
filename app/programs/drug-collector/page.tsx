// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import PageAvatar from '@/components/PageAvatar';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Stethoscope, CheckCircle } from 'lucide-react';
import { CompactHero } from '@/components/heroes/CompactHero';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


export const metadata: Metadata = {
  title: 'Drug & Alcohol Specimen Collector Certification | DOT Training',
  description:
    'DOT-certified drug collector training. Fast-track to a specialized healthcare career. High demand across transportation, healthcare, and corporate sectors.',
  keywords: [
    'Drug Collector Indianapolis',
    'Drug Collector training',
    'Drug Collector certification',
    'DOT certification',
    'specimen collector training',
  ],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/drug-collector',
  },
};

export default async function Page() {
  const supabase = await createClient();

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
  
  // Fetch drug collector program
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', 'drug-collector')
    .single();

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Drug Collector' },
        ]}
      />
      <CompactHero
        variant="default"
        badge={{
          icon: Stethoscope,
          text: 'Healthcare Career',
          href: '/programs/healthcare',
        }}
        headline="Drug & Alcohol Specimen Collector: DOT-certified training"
        description="Training to become a certified specimen collector. Work in healthcare facilities, labs, and workplace testing programs. High demand across multiple sectors."
        primaryCTA={{ text: 'Apply Now', href: '/apply' }}
        secondaryCTA={{ text: 'Talk to an Advisor', href: '/contact' }}
      />

      {/* Program Overview */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-black mb-6">
              Program Overview
            </h2>
            <p className="text-lg text-black mb-4">
              Become a certified Drug & Alcohol Specimen Collector and work in
              healthcare facilities, labs, and workplace testing programs. This
              specialized certification is in high demand across transportation,
              healthcare, and corporate sectors.
            </p>
            <p className="text-lg text-black mb-4">
              Our DOT-approved training meets all federal requirements for urine
              and breath alcohol specimen collection.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> DOT Certified
              </span>
              <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Job Placement
              </span>
              <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Fast Certification
              </span>
            </div>
            <div className="relative h-[250px] rounded-xl overflow-hidden mt-6">
              <Image
                src="/images/healthcare/healthcare-professional-portrait-1.jpg"
                alt="Healthcare professional"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="bg-blue-50 p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-black mb-4">
              Quick Facts
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">Duration:</span>
                <span className="text-black">2-3 weeks</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">Cost:</span>
                <span className="text-black">Contact for pricing</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">Format:</span>
                <span className="text-black">
                  Hybrid (online + hands-on)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">Starting Pay:</span>
                <span className="text-black">$16-$22/hour</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">Certification:</span>
                <span className="text-black">DOT-approved</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar videoSrc="/videos/avatars/drug-collector-guide.mp4" title="Drug Collector Program Guide" />

      {/* Pathway Disclosure */}
      <PathwayDisclosure programName="Drug Collector" programSlug="drug-collector" />

      {/* What You'll Learn */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">
            What You'll Learn
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-3">
                DOT Regulations
              </h3>
              <p className="text-black">
                Federal requirements for drug and alcohol testing
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-3">
                Specimen Collection
              </h3>
              <p className="text-black">
                Proper urine collection procedures and chain of custody
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-3">
                Breath Alcohol Testing
              </h3>
              <p className="text-black">
                Operating evidential breath testing devices
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-3">
                Documentation
              </h3>
              <p className="text-black">
                Accurate record-keeping and reporting
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-3">
                Quality Control
              </h3>
              <p className="text-black">
                Maintaining specimen integrity and validity
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-3">
                Legal Compliance
              </h3>
              <p className="text-black">
                Privacy laws and legal requirements
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Career Outlook */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-black mb-8 text-center">
          Career Opportunities
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-black mb-4">
              Work Settings
            </h3>
            <ul className="space-y-2 text-black">
              <li>• Medical Laboratories</li>
              <li>• Occupational Health Clinics</li>
              <li>• Mobile Collection Services</li>
              <li>• Corporate Testing Programs</li>
              <li>• Transportation Companies</li>
              <li>• Third-Party Administrators</li>
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-black mb-4">
              Why This Career?
            </h3>
            <ul className="space-y-2 text-black">
              <li>• High demand across industries</li>
              <li>• Flexible scheduling options</li>
              <li>• Specialized, respected role</li>
              <li>• Opportunities for mobile work</li>
              <li>• Stable employment</li>
              <li>• Room for advancement</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Credentials & Outcomes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <CredentialsOutcomes
            programName="Drug & Alcohol Specimen Collector"
            partnerCertifications={[
              'DOT Urine Specimen Collector Certification',
              'DOT Breath Alcohol Technician (BAT) Certification',
              'Non-DOT Collection Certification',
            ]}
            employmentOutcomes={[
              'Drug & Alcohol Specimen Collector',
              'Mobile Collection Technician',
              'Occupational Health Technician',
              'Laboratory Collection Specialist',
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Get DOT-Certified in Weeks
          </h2>
          <p className="text-xl mb-8">
            Start your specialized healthcare career today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 font-bold rounded-lg transition-all text-center"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg transition-all text-center border-2 border-white"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
