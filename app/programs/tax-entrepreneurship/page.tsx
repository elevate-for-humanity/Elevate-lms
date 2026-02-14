export const dynamic = 'force-dynamic';

// Force static generation for performance

import type { Metadata } from 'next';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import PageAvatar from '@/components/PageAvatar';
import { createPublicClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


export const metadata: Metadata = {
  title: 'Tax Preparation & Entrepreneurship',
  description:
    'Tax preparation certification and small business development training. Free with funding when eligible.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/tax-entrepreneurship',
  },
};

export default async function TaxEntrepreneurshipPage() {
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
  
  // Fetch tax entrepreneurship program
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', 'tax-entrepreneurship')
    .single();
  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Tax Entrepreneurship' },
        ]}
      />
      {/* Hero */}
      <section className="bg-white text-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-4 py-2 bg-white0 text-white text-sm font-bold rounded-full">
              Free with funding
            </span>
            <span className="px-4 py-2 bg-white0 text-white text-sm font-bold rounded-full">
              Online / Hybrid
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Tax Preparation & Entrepreneurship
          </h1>
          <p className="text-xl text-black mb-8 max-w-3xl">
            Tax preparation certification and small business development
            training
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/apply?program=tax-prep-financial-services"
              className="px-8 py-4 bg-brand-orange-600 hover:bg-brand-orange-600 text-white font-bold rounded-lg transition-all text-center"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white hover:bg-gray-100 text-brand-blue-900 font-bold rounded-lg transition-all text-center"
            >
              Get Free Info
            </Link>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar videoSrc="/videos/avatars/financial-guide.mp4" title="Tax Entrepreneurship Program Guide" />

      {/* Pathway Disclosure */}
      <PathwayDisclosure programName="Tax Entrepreneurship" programSlug="tax-entrepreneurship" />

      {/* At-a-Glance */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-black mb-8">At-a-Glance</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-4">
              <Image src="/images/icons/clock.png" alt="Duration" width={24} height={24} className="flex-shrink-0 mt-1" loading="lazy" />
              <div>
                <h3 className="font-bold text-black mb-1">Duration</h3>
                <p className="text-black">6-12 weeks</p>
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
                <p className="text-black">Online / Hybrid</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Image src="/images/icons/award.png" alt="Outcome" width={24} height={24} className="flex-shrink-0 mt-1" loading="lazy" />
              <div>
                <h3 className="font-bold text-black mb-1">Outcome</h3>
                <p className="text-black">
                  Tax prep certification + Business skills
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Program Is For */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-black mb-6">
            Who This Program Is For
          </h2>
          <div className="bg-white rounded-xl p-8 shadow-sm">
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
              <h3 className="font-bold text-black mb-2">Tax Preparer</h3>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <h3 className="font-bold text-black mb-2">
                Small Business Owner
              </h3>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <h3 className="font-bold text-black mb-2">Entrepreneur</h3>
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
            href="/apply?program=tax-prep-financial-services"
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
            programName="Tax Entrepreneurship"
            partnerCertifications={[
              'IRS PTIN (Preparer Tax Identification Number)',
              'IRS Annual Filing Season Program (AFSP)',
              'QuickBooks Certified User (issued by Intuit)',
              'Enrolled Agent (EA) exam preparation',
            ]}
            employmentOutcomes={[
              'Tax Business Owner',
              'Independent Tax Preparer',
              'Tax Franchise Operator',
              'Bookkeeping Service Provider',
            ]}
          />
        </div>
      </section>
    </div>
  );
}
