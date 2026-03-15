
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Building2 } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding/federal-programs' },
  title: 'Federal Funding Programs | Elevate For Humanity',
  description: 'Federal workforce development funding including WIOA Title I, workforce grants, and veteran education benefits.',
};

const PROGRAMS = [
  {
    name: 'WIOA Title I — Adult Program',
    agency: 'U.S. Department of Labor',
    desc: 'Provides funding for career services and training to eligible adults age 18+. Covers tuition, books, supplies, and supportive services such as transportation and childcare assistance.',
    eligible: ['Adults 18+ who meet income guidelines', 'Priority for public assistance recipients, low-income, and basic skills deficient'],
  },
  {
    name: 'WIOA Title I — Dislocated Worker',
    agency: 'U.S. Department of Labor',
    desc: 'Supports workers who have been laid off or displaced due to plant closures, downsizing, or economic conditions. Covers retraining in high-demand occupations.',
    eligible: ['Workers who lost jobs through no fault of their own', 'Self-employed individuals who lost income due to economic conditions'],
  },
  {
    name: 'WIOA Title I — Youth Program',
    agency: 'U.S. Department of Labor',
    desc: 'Serves eligible youth ages 16-24 with barriers to employment. Includes occupational skills training, work experience, mentoring, and follow-up services.',
    eligible: ['Youth ages 16-24 who are low-income', 'Must have one or more barriers to employment'],
  },
  {
    name: 'DOL Registered Apprenticeship',
    agency: 'U.S. Department of Labor',
    desc: 'Earn-and-learn model combining on-the-job training with related technical instruction. Apprentices earn wages while training toward a nationally recognized credential.',
    eligible: ['Must meet employer and program requirements', 'Age 16+ (18+ for hazardous occupations)'],
  },
  {
    name: 'Trade Adjustment Assistance (TAA)',
    agency: 'U.S. Department of Labor',
    desc: 'Assists workers who lost jobs due to foreign trade. Provides retraining, job search allowances, relocation allowances, and income support during training.',
    eligible: ['Workers certified by DOL as trade-affected', 'Must be enrolled in approved training program'],
  },
];

export default function FederalProgramsPage() {

  return (
    <div className="min-h-screen bg-white">      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Federal Programs' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/images/pages/funding-page-2.jpg" alt="Federal funding programs" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Federal Funding Programs</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Federal workforce development programs that may cover the cost of your career training.</p>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          {PROGRAMS.map((p) => (
            <div key={p.name} className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <Building2 className="w-6 h-6 text-brand-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{p.name}</h2>
                  <p className="text-sm text-gray-500">{p.agency}</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{p.desc}</p>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Who May Be Eligible:</h3>
                <p className="text-gray-600 text-sm">{p.eligible.join('. ')}.</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-amber-800 text-sm">
              Eligibility for federal programs is determined by the administering agency, not by Elevate for Humanity. Program availability and funding levels are subject to change. Contact your local WorkOne office or our enrollment team for current information.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Find Out If You Qualify</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">Our enrollment team can help determine which funding sources apply to your situation.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/workforce-board/eligibility" className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-white text-lg">Check Eligibility</Link>
            <Link href="/contact" className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
