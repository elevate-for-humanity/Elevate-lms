
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Circle, ArrowLeft, Clock, Calendar, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hair Follicle Drug Tests | Drug Testing Services',
  description: '90-day detection window hair drug testing. Difficult to cheat, ideal for pre-employment screening.',
};

const hairTests = [
  {
    name: 'Hair Follicle 5-Panel',
    price: 125,
    description: 'Standard 5-panel with 90-day detection window.',
    includes: [
      '90-day drug use history',
      '5-panel: THC, Cocaine, Opiates, Amphetamines, PCP',
      'Expanded opiates included',
      'MRO review and verification',
      'Difficult to adulterate or cheat',
      'Ideal for pre-employment screening',
    ],
    turnaround: '3-5 business days',
    detection: '90 days',
    image: '/images/pages/testing-page-1.jpg',
  },
  {
    name: 'Hair Follicle 10-Panel',
    price: 189,
    popular: true,
    description: 'Comprehensive 10-panel with extended detection.',
    includes: [
      '90-day drug use history',
      'Tests 10 substance categories',
      'Includes benzodiazepines, barbiturates',
      'Extended opiate panel',
      'MRO review included',
      'Most thorough pre-employment option',
    ],
    turnaround: '3-5 business days',
    detection: '90 days',
    image: '/images/pages/testing-page-1.jpg',
  },
  {
    name: 'Hair 5-Panel (NO THC)',
    price: 125,
    description: 'THC-free option for legal cannabis states.',
    includes: [
      '90-day detection window',
      'Tests: Cocaine, Opiates, Amphetamines, PCP',
      'Does NOT test for marijuana/THC',
      'Compliant with state employment laws',
      'MRO review included',
      'Same thorough detection',
    ],
    turnaround: '3-5 business days',
    detection: '90 days',
    image: '/images/pages/testing-page-1.jpg',
  },
];

export default function HairTestsPage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Drug Testing", href: "/drug-testing" }, { label: "Hair Tests" }]} />
      </div>
{/* Hero */}
      <section className="relative py-20 bg-brand-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/drug-testing" className="inline-flex items-center gap-2 text-brand-blue-200 hover:text-white mb-6 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Drug Testing
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Hair Follicle Tests</h1>
          <p className="text-xl text-brand-blue-100 max-w-2xl">
            The gold standard for pre-employment screening. Hair testing provides a 90-day detection window 
            and is extremely difficult to cheat.
          </p>
        </div>
      </section>

      {/* Why Hair Testing */}
      <section className="py-12 bg-brand-blue-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why Choose Hair Testing?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">90-Day Window</h3>
              <p className="text-gray-600 text-sm">Detects drug use from the past 3 months, not just recent use</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Hard to Cheat</h3>
              <p className="text-gray-600 text-sm">Cannot be beaten by abstaining for a few days or using detox products</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Circle className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Pattern Detection</h3>
              <p className="text-gray-600 text-sm">Shows history of use, not just a single point in time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Note */}
      <section className="py-4 bg-amber-50 border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-amber-900 font-medium text-center">
            <strong>All prices are per person</strong> — includes collection, lab analysis, MRO review, and results delivery.
          </p>
        </div>
      </section>

      {/* Tests */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid gap-8">
            {hairTests.map((test) => (
              <div
                key={test.name}
                className={`bg-white rounded-2xl overflow-hidden shadow-lg border-2 ${test.popular ? 'border-brand-blue-500' : 'border-gray-200'}`}
              >
                <div className="grid lg:grid-cols-3">
                  <div className="relative h-64 lg:h-auto">
                    <Image
                      src={test.image}
                      alt={test.name}
                      fill
                      className="object-cover"
                    />
                    {test.popular && (
                      <div className="absolute top-4 left-4 bg-brand-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        RECOMMENDED
                      </div>
                    )}
                  </div>
                  
                  <div className="lg:col-span-2 p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{test.name}</h2>
                        <p className="text-gray-600 mt-1">{test.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-brand-blue-600">${test.price}</div>
                        <div className="text-sm text-gray-500">per person</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                      <span className="flex items-center gap-1 bg-brand-blue-100 text-brand-blue-700 px-3 py-1 rounded-full">
                        <Calendar className="w-4 h-4" />
                        {test.detection} detection
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Results in {test.turnaround}
                      </span>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-bold text-gray-900 mb-3">What's Included:</h3>
                      <ul className="grid md:grid-cols-2 gap-2">
                        {test.includes.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <Circle className="w-4 h-4 text-brand-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-6">
                      <a
                        href="/support"
                        className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-700 transition"
                      >
                        <Phone className="w-4 h-4" />
                        Order Now
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Hair vs. Urine Testing</h2>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-900">Hair Test</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-900">Urine Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-6 py-4 text-gray-700">Detection Window</td>
                  <td className="px-6 py-4 text-center font-bold text-brand-blue-600">90 days</td>
                  <td className="px-6 py-4 text-center text-gray-600">1-7 days</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Cheat Resistant</td>
                  <td className="px-6 py-4 text-center font-bold text-brand-blue-600">Very High</td>
                  <td className="px-6 py-4 text-center text-gray-600">Moderate</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Results Time</td>
                  <td className="px-6 py-4 text-center text-gray-600">3-5 days</td>
                  <td className="px-6 py-4 text-center font-bold text-brand-blue-600">24-48 hours</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Cost</td>
                  <td className="px-6 py-4 text-center text-gray-600">Higher</td>
                  <td className="px-6 py-4 text-center font-bold text-brand-blue-600">Lower</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-700">Best For</td>
                  <td className="px-6 py-4 text-center text-brand-blue-600">Pre-employment</td>
                  <td className="px-6 py-4 text-center text-brand-blue-600">Random/Post-accident</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for Thorough Screening?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Hair testing gives you the most complete picture of a candidate's drug use history.
          </p>
          <a
            href="/support"
            className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-white transition text-lg"
          >
            <Phone className="w-5 h-5" />
            (317) 314-3757
          </a>
        </div>
      </section>
    </div>
  );
}
