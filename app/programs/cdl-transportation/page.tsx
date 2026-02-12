// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import type { Metadata } from 'next';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import { createPublicClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import VideoHeroBanner from '@/components/home/VideoHeroBanner';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


export const metadata: Metadata = {
  title:
    'CDL & Transportation Training | Free Commercial Driver License Program',
  description:
    'Commercial Driver License training for truck driving careers. 100% funded through WIOA and state grants. Start earning $50K+ annually.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/cdl-transportation',
  },
};

export default async function CdlTransportationPage() {
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
  
  // Fetch CDL program
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', 'cdl-transportation')
    .single();
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'CDL Transportation' },
        ]}
      />
      <VideoHeroBanner
        videoSrc="/videos/cdl-hero.mp4"
        headline="CDL & Transportation"
        subheadline="Start Your Trucking Career - Earn $50K+ Annually"
        primaryCTA={{ text: 'Apply Now', href: '/apply' }}
        secondaryCTA={{ text: 'View All Programs', href: '/programs' }}
      />

      {/* Avatar Guide */}
      <PageAvatar 
        videoSrc="/videos/avatars/trades-guide.mp4" 
        title="CDL Guide" 
      />

      {/* At-a-Glance */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-black mb-8">At-a-Glance</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-4">
              <Image src="/images/icons/clock.png" alt="Duration" width={24} height={24} className="flex-shrink-0 mt-1" loading="lazy" />
              <div>
                <h3 className="font-bold text-black mb-1">Duration</h3>
                <p className="text-black">4-8 weeks</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Image src="/images/icons/dollar.png" alt="Cost" width={24} height={24} className="flex-shrink-0 mt-1" loading="lazy" />
              <div>
                <h3 className="font-bold text-black mb-1">Cost</h3>
                <p className="text-black">Free with funding when eligible</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Image src="/images/icons/shield.png" alt="Format" width={24} height={24} className="flex-shrink-0 mt-1" loading="lazy" />
              <div>
                <h3 className="font-bold text-black mb-1">Format</h3>
                <p className="text-black">In-person</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Image src="/images/icons/award.png" alt="Outcome" width={24} height={24} className="flex-shrink-0 mt-1" loading="lazy" />
              <div>
                <h3 className="font-bold text-black mb-1">Outcome</h3>
                <p className="text-black">CDL License + Job placement</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pathway Disclosure */}
      <PathwayDisclosure programName="CDL Transportation" programSlug="cdl-transportation" />

      {/* About the Program */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-black mb-6">
            About the Program
          </h2>
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <p className="text-black mb-4">
              Our CDL & Transportation program prepares you for a high-demand career in commercial truck driving. Earn your Commercial Driver's License (CDL) and start a career with strong earning potential and job security.
            </p>
            <p className="text-black mb-4">
              With experienced instructors and hands-on training, you'll learn everything from vehicle operation and safety to DOT regulations and route planning. Most graduates secure employment within weeks of completing the program.
            </p>
            <p className="text-black">
              The trucking industry offers excellent opportunities for career growth, with starting salaries of $50,000+ annually and potential to earn $70,000+ with experience. Many companies offer sign-on bonuses and benefits packages.
            </p>
          </div>
        </div>
      </section>

      {/* Who This Program Is For */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-black mb-6">
            Who This Program Is For
          </h2>
          <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Image src="/images/icons/check-circle.png" alt="Check" width={24} height={24} className="flex-shrink-0 mt-0.5" loading="lazy" />
                <span className="text-black">
                  Individuals seeking career change or advancement
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Image src="/images/icons/check-circle.png" alt="Check" width={24} height={24} className="flex-shrink-0 mt-0.5" loading="lazy" />
                <span className="text-black">
                  No prior experience required for most programs
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Image src="/images/icons/check-circle.png" alt="Check" width={24} height={24} className="flex-shrink-0 mt-0.5" loading="lazy" />
                <span className="text-black">
                  Justice-impacted individuals welcome
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Image src="/images/icons/check-circle.png" alt="Check" width={24} height={24} className="flex-shrink-0 mt-0.5" loading="lazy" />
                <span className="text-black">
                  Barriers support available
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-black mb-6">
            What You'll Learn
          </h2>
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <ul className="space-y-3 list-disc list-inside">
              <li className="text-black">Vehicle inspection and maintenance basics</li>
              <li className="text-black">Safe driving techniques and defensive driving</li>
              <li className="text-black">DOT regulations and compliance</li>
              <li className="text-black">Hours of service and logbook management</li>
              <li className="text-black">Cargo handling and securement</li>
              <li className="text-black">Route planning and navigation</li>
              <li className="text-black">Backing, parking, and maneuvering</li>
              <li className="text-black">Emergency procedures and accident prevention</li>
              <li className="text-black">Customer service and professionalism</li>
              <li className="text-black">CDL exam preparation (written and road test)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Funding Options */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-black mb-6">
            Funding Options
          </h2>
          <p className="text-black mb-6">You may qualify for:</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-black mb-2">WIOA</h3>
              <p className="text-black text-sm">
                Workforce Innovation and Opportunity Act funding
              </p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-black mb-2">WRG</h3>
              <p className="text-black text-sm">Workforce Ready Grant</p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-black mb-2">JRI</h3>
              <p className="text-black text-sm">
                Justice Reinvestment Initiative
              </p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-bold text-black mb-2">
                Employer Sponsorship
              </h3>
              <p className="text-black text-sm">
                Some employers sponsor training
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support Services */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-black mb-6">
            Support Services
          </h2>
          <p className="text-black mb-6">We help coordinate:</p>
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Image src="/images/icons/users.png" alt="Users" width={20} height={20} className="flex-shrink-0 mt-0.5" loading="lazy" />
                <span className="text-black">Case management</span>
              </li>
              <li className="flex items-start gap-3">
                <Image src="/images/icons/users.png" alt="Users" width={20} height={20} className="flex-shrink-0 mt-0.5" loading="lazy" />
                <span className="text-black">
                  Justice navigation for returning citizens
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Image src="/images/icons/users.png" alt="Users" width={20} height={20} className="flex-shrink-0 mt-0.5" loading="lazy" />
                <span className="text-black">Transportation resources</span>
              </li>
              <li className="flex items-start gap-3">
                <Image src="/images/icons/users.png" alt="Users" width={20} height={20} className="flex-shrink-0 mt-0.5" loading="lazy" />
                <span className="text-black">Childcare referrals</span>
              </li>
              <li className="flex items-start gap-3">
                <Image src="/images/icons/users.png" alt="Users" width={20} height={20} className="flex-shrink-0 mt-0.5" loading="lazy" />
                <span className="text-black">Documentation support</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-black mb-6">
            Career Outcomes
          </h2>
          <p className="text-black mb-6">Students typically move into:</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-6 text-center">
              <h3 className="font-bold text-black mb-2">
                Commercial Truck Driver
              </h3>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <h3 className="font-bold text-black mb-2">Delivery Driver</h3>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <h3 className="font-bold text-black mb-2">
                Transportation Specialist
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-white text-white py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Next Steps</h2>
          <div className="space-y-4 text-left max-w-2xl mx-auto mb-8">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-orange-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold mb-1">Apply</h3>
                <p className="text-black text-sm">
                  Submit your application online
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-orange-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold mb-1">Meet with advisor</h3>
                <p className="text-black text-sm">
                  Discuss your goals and eligibility
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-orange-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold mb-1">Confirm eligibility</h3>
                <p className="text-black text-sm">
                  We help with funding paperwork
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-orange-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-bold mb-1">Enroll</h3>
                <p className="text-black text-sm">
                  Start your training program
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/apply"
            className="inline-block px-10 py-5 bg-brand-orange-600 hover:bg-brand-orange-600 text-white font-bold text-xl rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            Apply Now
          </Link>
        </div>
      </section>

      {/* Credentials & Outcomes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <CredentialsOutcomes
            programName="CDL Transportation"
            partnerCertifications={[
              'Commercial Driver License Class A (issued by Indiana BMV)',
              'DOT Medical Card',
              'Hazmat Endorsement (optional)',
            ]}
            employmentOutcomes={[
              'Over-the-Road (OTR) Truck Driver',
              'Local/Regional Delivery Driver',
              'Tanker Driver',
              'Flatbed Driver',
            ]}
          />
        </div>
      </section>
    </div>
  );
}
