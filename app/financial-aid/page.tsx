import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { DollarSign, FileText, Phone, ArrowRight, Shield, Clock, Users, Calculator } from 'lucide-react';
import { FinancialAidCalculator } from '@/components/FinancialAidCalculator';
import { BNPL_PROVIDER_NAMES } from '@/lib/bnpl-config';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Financial Aid & Funding | Elevate For Humanity',
  description: 'Learn about funded training through WIOA, state grants, and other workforce funding options. Training may be fully funded for eligible participants.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/financial-aid',
  },
};

const fundingOptions = [
  {
    title: 'WIOA Funding',
    description: 'Workforce Innovation and Opportunity Act covers 100% of tuition for eligible participants.',
    eligibility: ['Indiana resident', 'Unemployed or underemployed', 'Meet income guidelines', '18+ years old'],
    coverage: '100% tuition covered',
    icon: Shield,
  },
  {
    title: 'State Grants',
    description: 'Indiana state workforce development grants for career training programs.',
    eligibility: ['Indiana resident', 'High school diploma or GED', 'Career-focused goals', 'Program-specific requirements'],
    coverage: 'Up to 100% tuition',
    icon: FileText,
  },
  {
    title: 'Employer Sponsorship',
    description: 'Many employers will sponsor your training in exchange for employment commitment.',
    eligibility: ['Accepted into program', 'Willing to work for sponsor', 'Pass background check', 'Meet employer requirements'],
    coverage: 'Varies by employer',
    icon: Users,
  },
  {
    title: 'Payment Plans',
    description: 'For those who do not qualify for funded training, we offer affordable payment options.',
    eligibility: ['Anyone not eligible for grants', 'Valid ID required', 'No credit check', 'Flexible terms'],
    coverage: 'Split into monthly payments',
    icon: Clock,
  },
  {
    title: 'Buy Now, Pay Later (BNPL)',
    description: `Split tuition into 4–6 installments with ${BNPL_PROVIDER_NAMES}.`,
    eligibility: ['No hard credit check for most providers', 'Instant approval available', 'Self-pay students', 'Set up at enrollment'],
    coverage: 'Pay over 4–6 installments',
    icon: DollarSign,
  },
];

const steps = [
  { step: 1, title: 'Apply Online', description: 'Complete our simple 10-minute application form.' },
  { step: 2, title: 'Eligibility Review', description: 'Our team reviews your information within 2-3 business days.' },
  { step: 3, title: 'Funding Match', description: 'We identify the best funding options for your situation.' },
  { step: 4, title: 'Enrollment', description: 'Once approved, you can start your training program.' },
];

export default function FinancialAidPage() {
  return (
    <div className="min-h-screen bg-white prose-institutional">      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Financial Aid' }]} />
        </div>
      </div>

      {/* Hero with Image */}
      <section className="relative min-h-48 md:h-64 flex items-center overflow-hidden">
        <Image
          src="/images/pages/financial-aid-page-1.jpg"
          alt="Financial aid and funding options"
          fill
          className="object-cover"
          priority
        />
      </section>

      {/* Quick Links to Related Pages */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/wioa-eligibility" className="px-4 py-2 bg-brand-green-100 text-brand-green-800 rounded-full text-sm font-medium hover:bg-brand-green-200 transition-colors">
              WIOA Eligibility
            </Link>
            <Link href="/funding" className="px-4 py-2 bg-brand-blue-100 text-brand-blue-800 rounded-full text-sm font-medium hover:bg-brand-blue-200 transition-colors">
              All Funding Options
            </Link>
            <Link href="/funding/job-ready-indy" className="px-4 py-2 bg-brand-blue-100 text-brand-blue-800 rounded-full text-sm font-medium hover:bg-brand-blue-200 transition-colors">
              JRI Programs
            </Link>
            <Link href="/how-it-works" className="px-4 py-2 bg-brand-orange-100 text-brand-orange-800 rounded-full text-sm font-medium hover:bg-brand-orange-200 transition-colors">
              How It Works
            </Link>
            <Link href="/faq" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors">
              FAQ
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-brand-green-50 border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-green-600 mb-2">Multiple</div>
              <div className="text-gray-600">Funding Options</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-green-600 mb-2">Funded</div>
              <div className="text-gray-600">For Qualifying Students</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-green-600 mb-2">2-3 Days</div>
              <div className="text-gray-600">Approval Time</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand-green-600 mb-2">No Loans</div>
              <div className="text-gray-600">Required</div>
            </div>
          </div>
        </div>
      </section>

      {/* Funding Options */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Funding Options</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            We work with multiple funding sources to ensure you can access career training regardless of your financial situation.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {fundingOptions.map((option) => (
              <div key={option.title} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <option.icon className="w-6 h-6 text-brand-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{option.title}</h3>
                    <p className="text-gray-600 mb-4">{option.description}</p>
                    <div className="bg-brand-green-50 rounded-lg p-4 mb-4">
                      <div className="text-sm font-medium text-brand-green-800 mb-2">Coverage: {option.coverage}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Eligibility:</div>
                      <ul className="space-y-1">
                        {option.eligibility.map((req) => (
                          <li key={req} className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="text-slate-400 flex-shrink-0">•</span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financial Aid Calculator */}
      <section className="py-16 lg:py-24 bg-white border-t">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand-blue-100 text-brand-blue-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Calculator className="w-4 h-4" />
              Estimate Your Costs
            </div>
            <h2 className="text-3xl font-bold mb-4">Financial Aid Calculator</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get an estimate of your potential financial aid package based on your income and program costs.
            </p>
          </div>
          <FinancialAidCalculator />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How to Get Started</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-brand-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-brand-green-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your New Career?</h2>
          <p className="text-xl text-white/90 mb-8">
            Apply today and find out if you qualify for funded training. No obligation, no credit check.
          </p>
          <Link
            href="/start"
            className="inline-flex items-center gap-2 bg-white text-brand-green-700 px-8 py-4 rounded-lg font-semibold hover:bg-brand-green-50 transition-colors"
          >
            Apply Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
