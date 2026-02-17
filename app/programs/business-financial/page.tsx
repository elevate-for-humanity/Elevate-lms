// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import type { Metadata } from 'next';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Briefcase, Clock, DollarSign, Shield, Award, CheckCircle, Users } from 'lucide-react';
import { CompactHero } from '@/components/heroes/CompactHero';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


export const metadata: Metadata = {
  title: 'Business & Financial Services Programs | Free Training',
  description:
    'Business administration, financial services, and professional skills training. 100% funded through WIOA and state grants. Launch your business career.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/business-financial',
  },
};

export default async function BusinessFinancialPage() {
  const supabase = await createClient();

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
  
  // Fetch business financial programs
  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .eq('category', 'business_financial');
  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Business & Financial' },
        ]}
      />
      {/* Hero Section */}
      <section className="relative w-full -mt-[72px]">
        <div className="relative min-h-[100vh] sm:min-h-[70vh] md:min-h-[75vh] w-full overflow-hidden">
          <Image
            src="/images/pathways/trades-hero.jpg"
            alt="Business & Financial Programs"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            quality={85}
          />
          
          {/* Hero Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-full mb-6">
                <Briefcase className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wide">
                  Business & Finance
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 text-gray-900 drop-shadow-lg">
                Launch your business career with professional training
              </h1>
              
              <p className="text-lg md:text-xl mb-8 text-gray-800 drop-shadow">
                Business administration, financial services, and professional skills programs. 100% funded options available through WIOA and state grants.
              </p>
              
              <div className="flex flex-col gap-4 sm:flex-row justify-center">
                <Link
                  href="#programs"
                  className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-bold bg-white text-orange-600 hover:bg-gray-100 transition shadow-lg"
                >
                  View Programs
                </Link>
                <Link
                  href="/intake"
                  className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-bold border-2 border-white text-white hover:bg-white/10 transition"
                >
                  Check Eligibility
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pathway Disclosure */}
      <PathwayDisclosure programName="Business & Financial Services" programSlug="business-financial" />

      {/* At-a-Glance */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-black mb-8">At-a-Glance</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-black mb-1">Duration</h3>
                <p className="text-black">8-16 weeks</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <DollarSign className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-black mb-1">Cost</h3>
                <p className="text-black">Free with funding when eligible</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-black mb-1">Format</h3>
                <p className="text-black">Online / Hybrid</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Award className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-black mb-1">Outcome</h3>
                <p className="text-black">Job placement or certification</p>
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
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">
                  Individuals seeking career change or advancement
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">
                  No prior experience required for most programs
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">
                  Justice-impacted individuals welcome
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
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
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-bold text-black mb-2">WIOA</h3>
              <p className="text-black text-sm">
                Workforce Innovation and Opportunity Act funding
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-bold text-black mb-2">WRG</h3>
              <p className="text-black text-sm">Workforce Ready Grant</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-bold text-black mb-2">JRI</h3>
              <p className="text-black text-sm">
                Justice Reinvestment Initiative
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6">
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
                <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">Case management</span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">
                  Justice navigation for returning citizens
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">Transportation resources</span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-black">Childcare referrals</span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
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
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <h3 className="font-bold text-black mb-2">
                Administrative Assistant
              </h3>
            </div>
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <h3 className="font-bold text-black mb-2">
                Financial Services Rep
              </h3>
            </div>
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <h3 className="font-bold text-black mb-2">
                Customer Service Specialist
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
            programName="Business & Financial Services"
            partnerCertifications={[
              'QuickBooks Certified User (issued by Intuit)',
              'IRS VITA/TCE Certification (issued by IRS)',
              'Microsoft Office Specialist (issued by Certiport/Microsoft)',
            ]}
            employmentOutcomes={[
              'Tax Preparer',
              'Bookkeeper',
              'Accounting Clerk',
              'Financial Services Representative',
              'Payroll Specialist',
            ]}
          />
        </div>
      </section>
    </div>
  );
}
