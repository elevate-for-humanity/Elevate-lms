import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, CheckCircle, ArrowLeft, Building2, Users, Shield, Clock, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Employer Drug Testing Programs | Drug Testing Services',
  description: 'Comprehensive drug testing programs for employers. Pre-employment, random, post-accident testing with volume discounts.',
};

const programTypes = [
  {
    name: 'Pre-Employment Screening',
    description: 'Test candidates before making a job offer.',
    features: [
      'Urine, hair, or instant testing options',
      'Results in 24-48 hours (most tests)',
      'MRO review included',
      'Secure online results portal',
    ],
  },
  {
    name: 'Random Testing Program',
    description: 'Ongoing deterrent for current employees.',
    features: [
      'Computer-generated random selections',
      'Customizable testing rates',
      'Nationwide collection sites',
      'Full program management',
    ],
  },
  {
    name: 'Post-Accident Testing',
    description: 'Test after workplace incidents.',
    features: [
      'Priority scheduling',
      'Instant and lab-based options',
      'Alcohol testing available',
      'Documentation support',
    ],
  },
  {
    name: 'Reasonable Suspicion',
    description: 'When supervisors observe signs of impairment.',
    features: [
      'Immediate scheduling',
      'Supervisor training available',
      'Confidential handling',
      'Documentation templates',
    ],
  },
];

const benefits = [
  {
    icon: Building2,
    title: 'Dedicated Account Manager',
    description: 'Single point of contact for all your testing needs.',
  },
  {
    icon: Users,
    title: 'Volume Discounts',
    description: 'Save money with tiered pricing for larger programs.',
  },
  {
    icon: Shield,
    title: 'Compliance Support',
    description: 'Help with DOT, state, and federal requirements.',
  },
  {
    icon: Clock,
    title: 'Fast Turnaround',
    description: 'Most results in 24-48 hours.',
  },
  {
    icon: BarChart3,
    title: 'Online Portal',
    description: 'Track tests, view results, run reports.',
  },
  {
    icon: CheckCircle,
    title: 'Nationwide Coverage',
    description: '20,000+ collection sites across the US.',
  },
];

const volumePricing = [
  { volume: '1-10 tests/month', discount: 'Standard pricing' },
  { volume: '11-25 tests/month', discount: '5% discount' },
  { volume: '26-50 tests/month', discount: '10% discount' },
  { volume: '51-100 tests/month', discount: '15% discount' },
  { volume: '100+ tests/month', discount: 'Custom pricing' },
];

export default function EmployerProgramsPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Drug Testing", href: "/drug-testing" }, { label: "Employer Programs" }]} />
      </div>
{/* Hero */}
      <section className="relative min-h-[400px] flex items-center">
        <div className="absolute inset-0">
          <Image
            src="/images/courses/medical-assistant-10002419-cover.jpg"
            alt="Employer Drug Testing Programs"
            fill
            className="object-cover"
            priority
          />
          
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <Link href="/drug-testing" className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Drug Testing
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">Employer Drug Testing Programs</h1>
          </div>
          <p className="text-xl text-gray-200 max-w-2xl mb-8">
            Comprehensive drug testing solutions for businesses of all sizes. 
            From startups to enterprises, we have a program that fits your needs.
          </p>
          <a
            href="/support"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700 transition text-lg"
          >
            <Phone className="w-5 h-5" />
            Set Up Account
          </a>
        </div>
      </section>

      {/* Program Types */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Testing Programs We Offer</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {programTypes.map((program) => (
              <div key={program.name} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{program.name}</h3>
                <p className="text-gray-600 mb-4">{program.description}</p>
                <ul className="space-y-2">
                  {program.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How We Help</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Volume Pricing */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Volume Discounts</h2>
          <p className="text-blue-200 text-center mb-8">
            The more you test, the more you save. All prices are per person.
          </p>
          <div className="bg-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="px-6 py-4 text-left font-bold">Monthly Volume</th>
                  <th className="px-6 py-4 text-right font-bold">Discount</th>
                </tr>
              </thead>
              <tbody>
                {volumePricing.map((tier, idx) => (
                  <tr key={tier.volume} className={idx < volumePricing.length - 1 ? 'border-b border-white/10' : ''}>
                    <td className="px-6 py-4">{tier.volume}</td>
                    <td className="px-6 py-4 text-right font-medium text-blue-200">{tier.discount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-blue-200 text-center mt-6 text-sm">
            Contact us for a custom quote based on your specific needs.
          </p>
        </div>
      </section>

      {/* How to Get Started */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How to Get Started</h2>
          <div className="space-y-6">
            {[
              { step: 1, title: 'Contact Us', desc: 'Call or email to discuss your testing needs and get a custom quote.' },
              { step: 2, title: 'Set Up Account', desc: 'Complete a simple agreement and set up your employer portal access.' },
              { step: 3, title: 'Add Employees', desc: 'Upload your employee list or add them as needed.' },
              { step: 4, title: 'Start Testing', desc: 'Send employees to any of our 20,000+ locations nationwide.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  {item.step}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Industries We Serve</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Transportation & Logistics',
              'Construction',
              'Manufacturing',
              'Healthcare',
              'Staffing Agencies',
              'Oil & Gas',
              'Retail',
              'Government',
              'Education',
              'Hospitality',
              'Warehousing',
              'And More...',
            ].map((industry) => (
              <div key={industry} className="bg-gray-50 p-4 rounded-lg text-center">
                <span className="text-gray-700 font-medium">{industry}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOT Compliance */}
      <section className="py-16 bg-orange-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">DOT-Regulated Employer?</h2>
              <p className="text-gray-700 mb-6">
                We specialize in DOT compliance for transportation companies. Our programs meet all 
                FMCSA, FAA, FRA, FTA, and PHMSA requirements.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'DOT drug and alcohol testing',
                  'Random testing consortium',
                  'Clearinghouse queries and reporting',
                  'Supervisor training',
                  'Policy development',
                  'Audit support',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/drug-testing/dot-testing"
                className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition"
              >
                Learn About DOT Testing
              </Link>
            </div>
            <div className="relative h-[350px] rounded-2xl overflow-hidden">
              <Image
                src="/images/success-new/success-1.jpg"
                alt="DOT Compliance"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Set Up Your Program?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Contact us today for a free consultation and custom quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition text-lg"
            >
              <Phone className="w-5 h-5" />
              Get Help Online
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-blue-700 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-800 transition text-lg border-2 border-white"
            >
              Request Quote
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
