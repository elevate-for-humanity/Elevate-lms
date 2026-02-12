// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import { createPublicClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Users, Award, Clock, DollarSign } from 'lucide-react';
import { CompactHero } from '@/components/heroes/CompactHero';
import { FundingBadge } from '@/components/programs/FundingBadge';
import PathwayDisclosure from '@/components/compliance/PathwayDisclosure';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


export const metadata: Metadata = {
  title: 'Direct Support Professional Training | Free DSP Program Indiana',
  description:
    'Funded DSP training program. Help individuals with disabilities live fulfilling lives. 4-6 weeks, job placement included.',
  keywords: [
    'Direct Support Professional Indianapolis',
    'free Direct Support Professional training',
    'WIOA Direct Support Professional',
    'Direct Support Professional apprenticeship',
  ],
  alternates: {
    canonical:
      'https://www.elevateforhumanity.org/programs/direct-support-professional',
  },
};

export default async function Page() {
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
  
  // Fetch DSP program info
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', 'direct-support-professional')
    .single();

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Direct Support Professional' },
        ]}
      />
      <CompactHero
        variant="default"
        badge={{
          icon: Heart,
          text: 'Healthcare Career',
          href: '/programs/healthcare',
        }}
        headline="Direct Support Professional: Make a difference in people's lives"
        description="Funded DSP training. Help individuals with disabilities live independently and participate fully in their communities. 4-6 weeks, job placement included."
        primaryCTA={{ text: 'Start Eligibility & Choose This Program', href: '/apply' }}
        secondaryCTA={{ text: 'Questions? Contact Us', href: 'tel:317-314-3757' }}
      />

      {/* Funding Badge */}
      <section className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <FundingBadge type="funded" />
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar videoSrc="/videos/avatars/healthcare-guide.mp4" title="DSP Program Guide" />

      {/* Program Overview */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-black mb-6">
              Program Overview
            </h2>
            <p className="text-lg text-black mb-4">
              Direct Support Professionals provide essential care and support to
              individuals with intellectual and developmental disabilities. This
              rewarding career helps people live independently and participate
              fully in their communities.
            </p>
            <p className="text-lg text-black mb-4">
              Our funded training program prepares you for immediate employment in
              residential facilities, day programs, and community settings.
            </p>
            <div className="relative h-[300px] rounded-xl overflow-hidden mt-6">
              <Image
                src="/images/gallery/image1.jpg"
                alt="DSP training session"
                fill sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="bg-white p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-black mb-4">
              Quick Facts
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">Duration:</span>
                <span className="text-black">4-6 weeks</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">Cost:</span>
                <span className="text-black">Funded for qualifying students</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">Format:</span>
                <span className="text-black">
                  Hybrid (online + in-person)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">Starting Pay:</span>
                <span className="text-black">$14-$18/hour</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">Job Placement:</span>
                <span className="text-black">Included</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">
            What You'll Learn
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-3">
                Person-Centered Care
              </h3>
              <p className="text-black">
                Supporting individual goals, preferences, and independence
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-3">
                Health & Safety
              </h3>
              <p className="text-black">
                Medication administration, first aid, emergency procedures
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-3">
                Communication
              </h3>
              <p className="text-black">
                Effective communication strategies and documentation
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-3">
                Rights & Ethics
              </h3>
              <p className="text-black">
                Protecting rights, dignity, and confidentiality
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-3">
                Behavioral Support
              </h3>
              <p className="text-black">
                Positive behavior strategies and crisis intervention
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-black mb-3">
                Community Integration
              </h3>
              <p className="text-black">
                Supporting community participation and social connections
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Career Outlook */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-black mb-8 text-center">
          Career Outlook
        </h2>
        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-black mb-4">
            The demand for Direct Support Professionals is growing rapidly as
            more individuals with disabilities choose community-based living.
            This is a stable, rewarding career with opportunities for
            advancement.
          </p>
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
              <h3 className="text-2xl font-bold text-black mb-4">
                Career Paths
              </h3>
              <ul className="space-y-2 text-black">
                <li>• Residential Support Specialist</li>
                <li>• Day Program Coordinator</li>
                <li>• Job Coach</li>
                <li>• Team Lead/Supervisor</li>
                <li>• Program Manager</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-black mb-4">
                Work Settings
              </h3>
              <ul className="space-y-2 text-black">
                <li>• Group Homes</li>
                <li>• Day Programs</li>
                <li>• Community Living</li>
                <li>• Vocational Programs</li>
                <li>• Respite Care</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials & Outcomes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <CredentialsOutcomes
            programName="Direct Support Professional"
            partnerCertifications={[
              'NADSP Credential (issued by National Alliance for Direct Support Professionals)',
              'CPR/First Aid Certification',
              'Medication Administration Certification',
            ]}
            employmentOutcomes={[
              'Direct Support Professional',
              'Residential Support Staff',
              'Community Integration Specialist',
              'Behavioral Health Technician',
            ]}
          />
        </div>
      </section>

      {/* Pathway Disclosure */}
      <section className="bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <PathwayDisclosure variant="full" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your DSP Career?
          </h2>
          <p className="text-xl mb-8">
            Check eligibility and begin training in weeks, not months.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply?program=direct-support-professional"
              className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 font-bold rounded-lg transition-all text-center"
            >
              Start Eligibility & Choose This Program
            </Link>
            <Link
              href="tel:317-314-3757"
              className="px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg transition-all text-center border-2 border-white"
            >
              Questions? Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
