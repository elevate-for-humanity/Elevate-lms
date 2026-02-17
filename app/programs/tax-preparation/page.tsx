// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { Clock, DollarSign, Shield, Award, CheckCircle, Users } from 'lucide-react';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


export const metadata: Metadata = {
  title:
    'Tax Preparation Training | IRS Certified | Start Your Tax Business | Indianapolis',
  description:
    'IRS-certified tax preparation training in Indianapolis. $1,500 tuition. Become a VITA volunteer or start your own tax business. IRS Link & Learn certified. Earn $40k-$100k+ per year.',
  keywords:
    'tax preparation training, IRS certified tax preparer, VITA volunteer training, start tax business, tax preparer course Indianapolis, IRS Link and Learn, become tax preparer, tax business training, H&R Block alternative, TurboTax Pro alternative, tax franchise alternative, PTIN certification, tax season business',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/tax-preparation',
  },
};

export default async function Page() {
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
  
  // Fetch tax preparation program
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', 'tax-preparation')
    .single();
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Tax Preparation' },
        ]}
      />
      {/* Hero with Picture */}
      <section className="relative w-full -mt-[72px]">
        <div className="relative min-h-[70vh] w-full overflow-hidden">
          <Image
            src="/images/business/program-tax-preparation.jpg"
            alt="VITA Tax Preparation Training"
            fill
            className="object-cover"
            priority
          />
          
          
          <div className="relative z-10 flex items-center justify-center min-h-[70vh]">
            <div className="max-w-5xl mx-auto px-6 text-center text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30">
                <Award className="w-6 h-6 text-purple-600 flex-shrink-0" />
                <span className="text-sm font-semibold">
                  IRS Certified Training
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black mb-6">
                Start Your Tax Preparation Business
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                IRS-certified training for $1,500. Earn $40k-$100k+ per year. Work
                from home. Be your own boss.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 font-bold rounded-xl hover:bg-gray-100 transition text-lg shadow-lg"
                >
                  Apply Now
                </Link>
                <a
                  href="https://www.indianacareerconnect.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-bold rounded-xl hover:bg-white/10 transition text-lg border-2 border-white"
                >
                  Schedule Appointment
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar videoSrc="/videos/avatars/tax-guide.mp4" title="Tax Preparation Program Guide" />

      {/* Pathway Disclosure */}
      <PathwayDisclosure programName="Tax Preparation" programSlug="tax-preparation" />

      {/* Why Tax Preparation */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Tax Preparation?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-purple-600 flex-shrink-0" />
              </div>
              <h3 className="font-bold text-lg mb-2">High Income</h3>
              <p className="text-black">$40k-$100k+ per year</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-purple-600 flex-shrink-0" />
              </div>
              <h3 className="font-bold text-lg mb-2">Flexible Schedule</h3>
              <p className="text-black">
                Work tax season, vacation the rest
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-5 h-5 text-purple-600 flex-shrink-0" />
              </div>
              <h3 className="font-bold text-lg mb-2">Be Your Own Boss</h3>
              <p className="text-black">Start your own tax business</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-purple-600 flex-shrink-0" />
              </div>
              <h3 className="font-bold text-lg mb-2">IRS Certified</h3>
              <p className="text-black">Nationally recognized credential</p>
            </div>
          </div>
        </div>
      </section>

      {/* IRS Link & Learn Integration */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            IRS-Approved Training Path
          </h2>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">
                    Complete Our Training Course
                  </h3>
                  <p className="text-black">
                    Learn tax preparation fundamentals, IRS regulations, and
                    business setup
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">
                    IRS Link & Learn Certification
                  </h3>
                  <p className="text-black mb-3">
                    Complete IRS Link & Learn modules for VITA volunteer
                    certification
                  </p>
                  <a
                    href="https://www.irs.gov/individuals/volunteers/link-learn-taxes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-600 font-semibold hover:underline"
                  >
                    Access IRS Link & Learn <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Get Your PTIN</h3>
                  <p className="text-black mb-3">
                    Apply for your Preparer Tax Identification Number from the
                    IRS
                  </p>
                  <a
                    href="https://www.irs.gov/tax-professionals/ptin-requirements-for-tax-return-preparers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-600 font-semibold hover:underline"
                  >
                    Apply for PTIN <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Start Earning</h3>
                  <p className="text-black">
                    Volunteer at VITA sites or start your own tax preparation
                    business
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Paths */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Choose Your Path
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 rounded-xl p-8 border-2 border-blue-200">
              <h3 className="text-2xl font-bold mb-4 text-blue-900">
                VITA Volunteer
              </h3>
              <p className="text-black mb-6">
                Help low-income families file taxes for free through IRS VITA
                program
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span>Gain experience helping real clients</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span>IRS-certified training and support</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span>Flexible volunteer hours</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span>Make a difference in your community</span>
                </li>
              </ul>
              <a
                href="https://www.irs.gov/individuals/irs-tax-volunteers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Become a VITA Volunteer <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="bg-green-50 rounded-xl p-8 border-2 border-green-200">
              <h3 className="text-2xl font-bold mb-4 text-green-900">
                Start Your Business
              </h3>
              <p className="text-black mb-6">
                Launch your own tax preparation business and earn $40k-$100k+
                per year
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span>Be your own boss</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span>Work from home or open an office</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span>Set your own rates and schedule</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span>Build recurring client base</span>
                </li>
              </ul>
              <Link
                href="/programs/tax-entrepreneurship"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
              >
                Start Your Tax Business →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative to Big Brands */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Why Pay Franchise Fees?</h2>
          <p className="text-xl text-black mb-8">
            H&R Block, Jackson Hewitt, and Liberty Tax charge $2,000-$10,000+ in
            franchise fees. TurboTax Pro costs $500+/year.
          </p>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-green-600">
              Our Training: $1,500 (No Ongoing Fees)
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-bold mb-3">What You Get:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <span>IRS-certified training</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <span>Business setup guidance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <span>Marketing strategies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <span>Tax software recommendations</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3">What You Save vs Franchises:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <span>$0 franchise fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <span>$0 royalty payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <span>$0 ongoing fees after training</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <span>Keep 100% of your profits</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-green-600 text-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Tax Business?
          </h2>
          <p className="text-xl mb-8">
            $1,500 tuition. IRS-certified. Start earning this tax season.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center px-10 py-5 bg-white text-green-600 font-bold rounded-lg hover:bg-green-50 transition text-lg"
            >
              Apply Now
            </Link>
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-10 py-5 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 transition text-lg border-2 border-white"
            >
              Schedule at IndianaCareerConnect.com
            </a>
          </div>
          <p className="mt-6">
            Call{' '}
            <a href="tel:3173143757" className="font-bold underline">
              317-314-3757
            </a>
          </p>
        </div>
      </section>

      {/* Credentials & Outcomes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <CredentialsOutcomes
            programName="Tax Preparation"
            partnerCertifications={[
              'IRS VITA/TCE Certification (issued by IRS)',
              'IRS PTIN (Preparer Tax Identification Number)',
              'QuickBooks Certified User (issued by Intuit)',
              'Microsoft Office Specialist (issued by Certiport/Microsoft)',
            ]}
            employmentOutcomes={[
              'Tax Preparer',
              'VITA Volunteer',
              'Tax Business Owner',
              'Bookkeeper',
              'Financial Services Representative',
            ]}
          />
        </div>
      </section>
    </div>
  );
}
