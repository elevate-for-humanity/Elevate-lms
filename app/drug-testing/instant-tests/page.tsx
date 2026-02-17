import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, ArrowLeft, Clock, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Instant Rapid Drug Tests | Drug Testing Services',
  description: 'On-site rapid drug testing with results in 5-10 minutes. Cost-effective screening for employers.',
};

const instantTests = [
  {
    name: 'Instant Rapid 5-Panel',
    price: 69,
    popular: true,
    description: 'Quick screening with immediate negative results.',
    includes: [
      'On-site rapid testing device',
      'Results in 5-10 minutes for negatives',
      '5-panel: THC, Cocaine, Opiates, Amphetamines, PCP',
      'Positive results sent to lab for confirmation',
      'Cost-effective for high-volume screening',
      'Ideal for pre-employment and random testing',
    ],
    turnaround: '5-10 minutes (negative)',
    labConfirm: '24-48 hours (if positive)',
    image: '/images/business/professional-2.jpg',
  },
  {
    name: 'Instant Rapid 10-Panel',
    price: 79,
    description: 'Expanded rapid screening for comprehensive coverage.',
    includes: [
      'Tests for 10 substance categories',
      'Immediate preliminary results',
      'Includes benzodiazepines, barbiturates',
      'Lab confirmation for any positives',
      'Detailed panel coverage',
      'Same-day results for negatives',
    ],
    turnaround: '5-10 minutes (negative)',
    labConfirm: '24-48 hours (if positive)',
    image: '/images/heroes/training-provider-3.jpg',
  },
  {
    name: 'Instant 5-Panel + Alcohol',
    price: 89,
    description: 'Rapid drug and alcohol screening combined.',
    includes: [
      'Rapid 5-panel drug screen',
      'Breath alcohol test (BAT)',
      'Immediate results for both',
      'Perfect for post-accident testing',
      'DOT-compliant alcohol testing available',
      'Combined reporting',
    ],
    turnaround: '5-10 minutes',
    image: '/images/heroes/contact.jpg',
  },
];

export default function InstantTestsPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Drug Testing", href: "/drug-testing" }, { label: "Instant Tests" }]} />
      </div>
{/* Hero */}
      <section className="relative py-20 bg-brand-green-800 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/drug-testing" className="inline-flex items-center gap-2 text-brand-green-200 hover:text-white mb-6 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Drug Testing
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-10 h-10" />
            <h1 className="text-4xl md:text-5xl font-bold">Instant Rapid Tests</h1>
          </div>
          <p className="text-xl text-brand-green-100 max-w-2xl">
            Get preliminary results in just 5-10 minutes. Perfect for high-volume screening, 
            post-accident testing, or when you need answers fast.
          </p>
        </div>
      </section>

      {/* How Instant Tests Work */}
      <section className="py-12 bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How Instant Tests Work</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-brand-green-600">1</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Collect Sample</h3>
              <p className="text-gray-600 text-sm">Urine sample collected at any of our 20,000+ locations</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-brand-green-600">2</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Rapid Analysis</h3>
              <p className="text-gray-600 text-sm">On-site testing device provides preliminary results in minutes</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-brand-green-600">3</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Results</h3>
              <p className="text-gray-600 text-sm">Negative = done. Positive = sent to lab for confirmation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Note */}
      <section className="py-4 bg-amber-50 border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-amber-900 font-medium text-center">
            <strong>All prices are per person</strong> — includes collection, rapid test, and lab confirmation if needed.
          </p>
        </div>
      </section>

      {/* Tests Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {instantTests.map((test) => (
              <div
                key={test.name}
                className={`bg-white rounded-2xl overflow-hidden shadow-lg border-2 ${test.popular ? 'border-brand-green-500' : 'border-gray-200'}`}
              >
                <div className="relative h-48">
                  <Image
                    src={test.image}
                    alt={test.name}
                    fill
                    className="object-cover"
                  />
                  {test.popular && (
                    <div className="absolute top-4 left-4 bg-brand-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      BEST VALUE
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{test.name}</h2>
                  <p className="text-gray-600 text-sm mb-4">{test.description}</p>
                  
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-brand-green-600">${test.price}</span>
                    <span className="text-gray-500">per person</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Clock className="w-4 h-4 text-brand-green-500" />
                    <span>{test.turnaround}</span>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <ul className="space-y-2">
                      {test.includes.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-slate-400 flex-shrink-0">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <a
                    href="/support"
                    className="block w-full text-center bg-brand-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-green-700 transition"
                  >
                    Order Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* When to Use */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">When to Use Instant Tests</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Pre-Employment', desc: 'Quick screening before making a job offer' },
              { title: 'Post-Accident', desc: 'Immediate testing after workplace incidents' },
              { title: 'Random Testing', desc: 'Cost-effective for ongoing programs' },
              { title: 'Reasonable Suspicion', desc: 'When you need answers right away' },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-green-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Fast Results?</h2>
          <p className="text-xl text-brand-green-100 mb-8">
            Schedule online to schedule instant testing at a location near you.
          </p>
          <a
            href="/support"
            className="inline-flex items-center gap-2 bg-white text-brand-green-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition text-lg"
          >
            <Phone className="w-5 h-5" />
            Get Help Online
          </a>
        </div>
      </section>
    </div>
  );
}
