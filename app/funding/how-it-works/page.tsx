
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DollarSign, FileCheck, GraduationCap, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding/how-it-works' },
  title: 'How Funding Works | Elevate For Humanity',
  description: 'Learn how WIOA, DOL, and state funding may cover the cost of your career training. Step-by-step guide to funded training programs.',
};

const STEPS = [
  { step: '1', title: 'Check Eligibility', desc: 'Attend an orientation session or contact us to determine if you qualify for funded training through WIOA, DOL apprenticeship, or state grant programs.', icon: HelpCircle },
  { step: '2', title: 'Get Approved', desc: 'Work with your enrollment advisor to complete the application. If you qualify, your funding source is identified and your training costs may be covered.', icon: FileCheck },
  { step: '3', title: 'Start Training', desc: 'Enroll in your chosen program and begin classes. Funding is applied directly — you do not pay out of pocket if approved.', icon: GraduationCap },
  { step: '4', title: 'Earn & Get Hired', desc: 'Complete your program, earn your certification, and connect with employer partners through our career services team.', icon: DollarSign },
];

const FUNDING_SOURCES = [
  { name: 'WIOA (Workforce Innovation and Opportunity Act)', desc: 'Federal funding administered through local WorkOne offices. Covers tuition, books, supplies, and supportive services for eligible adults and dislocated workers.', href: '/funding/federal-programs' },
  { name: 'DOL Registered Apprenticeship', desc: 'Earn while you learn through Department of Labor registered apprenticeship programs. Employer-sponsored with structured on-the-job training.', href: '/funding/dol' },
  { name: 'State Grant Programs', desc: 'Indiana state workforce development grants including Next Level Jobs Workforce Ready Grant and employer training grants.', href: '/funding/state-programs' },
  { name: 'Job Ready Indy (Job Ready Indy)', desc: 'Funding for justice-involved individuals re-entering the workforce. Covers training, certifications, and supportive services.', href: '/funding/jri' },
];

export default function FundingHowItWorksPage() {

  return (
    <div className="min-h-screen bg-white">      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'How It Works' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/images/pages/funding-page-3.jpg" alt="How funding works for career training" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">How Funding Works</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">Many of our training programs may be available at no cost to eligible participants through federal and state funding.</p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-12 text-center">Four Steps to Funded Training</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {s.step}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Funding Sources */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 text-center">Available Funding Sources</h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
            Eligibility varies by program and individual circumstances. Our enrollment team will help identify the right funding path for you.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {FUNDING_SOURCES.map((f) => (
              <Link key={f.name} href={f.href} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-brand-blue-300 transition-all group">
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand-blue-600">{f.name}</h3>
                <p className="text-slate-600 text-sm">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Important Note */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="font-bold text-amber-900 mb-2">Important</h3>
            <p className="text-amber-800 text-sm">
              Funding availability depends on eligibility determination, program availability, and current funding levels. Not all applicants will qualify for every funding source. Elevate for Humanity does not guarantee funding approval. All eligibility determinations are made by the appropriate funding agency.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to See If You Qualify?</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">
            Attend a free orientation or contact our enrollment team to get started.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/orientation/schedule" className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-white text-lg">
              Orientation Schedule
            </Link>
            <Link href="/contact" className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
