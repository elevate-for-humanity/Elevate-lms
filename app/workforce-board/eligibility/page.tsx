
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/workforce-board/eligibility' },
  title: 'WIOA Eligibility | Workforce Board | Elevate For Humanity',
  description: 'WIOA eligibility requirements for workforce development training programs. Check if you qualify for funded career training.',
};

const ELIGIBLE = [
  'U.S. citizen or authorized to work in the United States',
  'Age 18 or older (16+ for youth programs)',
  'Registered with Selective Service (males born after 12/31/1959)',
  'Meet income guidelines or qualify through a priority population',
  'Not currently enrolled in secondary education (adult programs)',
];

const PRIORITY_POPULATIONS = [
  'Veterans and eligible spouses',
  'Recipients of public assistance (TANF, SNAP, SSI)',
  'Individuals with disabilities',
  'Ex-offenders and justice-involved individuals',
  'Homeless individuals or runaway youth',
  'Foster care youth (current or former)',
  'English language learners',
  'Long-term unemployed (27+ weeks)',
  'Low-income individuals',
  'Single parents',
];

const DOCUMENTS_NEEDED = [
  'Government-issued photo ID (driver\'s license, state ID, passport)',
  'Social Security number (entered online)',
  'Proof of address (utility bill, lease agreement, bank statement)',
  'Proof of income (pay stubs, tax return, benefits letter)',
  'Selective Service registration (males 18-25)',
  'DD-214 (veterans)',
  'Court documents (if applicable for priority population status)',
];

export default function EligibilityPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Workforce Board', href: '/workforce-board' }, { label: 'Eligibility' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/homepage/funded-programs.jpg" alt="WIOA eligibility information" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">WIOA Eligibility</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Find out if you qualify for funded career training through the Workforce Innovation and Opportunity Act.</p>
          </div>
        </div>
      </section>

      {/* Basic Requirements */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Basic Requirements</h2>
          <p className="text-gray-600 mb-8">To be eligible for WIOA-funded training, you must meet the following criteria:</p>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <ul className="space-y-4">
              {ELIGIBLE.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Priority Populations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Priority Populations</h2>
          <p className="text-gray-600 mb-8">WIOA gives priority of service to individuals in the following categories:</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {PRIORITY_POPULATIONS.map((item) => (
              <div key={item} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3">
                <div className="w-2 h-2 bg-brand-blue-600 rounded-full flex-shrink-0" />
                <span className="text-gray-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-7 h-7 text-brand-blue-600" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Documents You May Need</h2>
          </div>
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
            <ul className="space-y-3">
              {DOCUMENTS_NEEDED.map((doc) => (
                <li key={doc} className="flex items-start gap-3 text-gray-700">
                  <span className="text-brand-blue-600 font-bold">-</span>
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <HelpCircle className="w-10 h-10 mx-auto mb-4 text-white/80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Not Sure If You Qualify?</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">
            Attend a free orientation session or contact us. Our enrollment advisors will help determine your eligibility.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/orientation/schedule"
              className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
            >
              View Orientation Schedule
            </Link>
            <Link
              href="/contact"
              className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
