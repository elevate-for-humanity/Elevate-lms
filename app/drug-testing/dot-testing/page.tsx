
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, ArrowLeft, Truck, FileCheck, AlertTriangle, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DOT Drug & Alcohol Testing | Drug Testing Services',
  description: 'FMCSA-compliant DOT drug testing for CDL drivers. Pre-employment, random, post-accident, and return-to-duty testing.',
};

const dotTests = [
  {
    name: 'DOT Pre-Employment',
    price: 89,
    popular: true,
    description: 'Required before hiring any DOT-regulated employee.',
    includes: [
      'DOT 5-panel urine drug test',
      'FMCSA-compliant collection',
      'SAMHSA-certified lab analysis',
      'MRO review and verification',
      'Clearinghouse query (if needed)',
      'Same-day scheduling available',
    ],
    image: '/images/pages/testing-page-1.jpg',
  },
  {
    name: 'DOT Random Testing',
    price: 89,
    description: 'Unannounced testing for DOT random pool members.',
    includes: [
      'DOT 5-panel urine drug test',
      'Random selection notification',
      'Immediate scheduling required',
      'Full chain of custody',
      'MRO review included',
      'Clearinghouse reporting',
    ],
    image: '/images/pages/testing-page-1.jpg',
  },
  {
    name: 'DOT Post-Accident',
    price: 89,
    description: 'Required after certain DOT-reportable accidents.',
    includes: [
      'DOT 5-panel drug test',
      'DOT breath alcohol test (BAT)',
      'Must be completed within 8 hours (alcohol) / 32 hours (drugs)',
      'Priority scheduling',
      'Full documentation',
      'MRO review included',
    ],
    image: '/images/pages/comp-home-highlight-health.jpg',
  },
  {
    name: 'DOT Reasonable Suspicion',
    price: 89,
    description: 'When a trained supervisor observes signs of impairment.',
    includes: [
      'DOT 5-panel drug test',
      'Breath alcohol test available',
      'Immediate scheduling',
      'Supervisor documentation support',
      'MRO review included',
      'Confidential handling',
    ],
    image: '/images/pages/comp-home-highlight-health.jpg',
  },
  {
    name: 'Return to Duty (RTD)',
    price: 425,
    description: 'Required before returning to safety-sensitive duties after a violation.',
    includes: [
      'Direct observation collection',
      'DOT 5-panel drug test',
      'SAP (Substance Abuse Professional) referral',
      'MRO review and clearance',
      'Clearinghouse status update',
      'Follow-up testing schedule setup',
      'Full compliance documentation',
    ],
    image: '/images/pages/comp-home-highlight-health.jpg',
  },
  {
    name: 'Follow-Up Testing',
    price: 89,
    description: 'Ongoing testing after return-to-duty clearance.',
    includes: [
      'Unannounced testing per SAP plan',
      'Minimum 6 tests in first 12 months',
      'DOT 5-panel drug test',
      'Direct observation if required',
      'MRO review included',
      'Clearinghouse reporting',
    ],
    image: '/images/pages/comp-pathway-classroom.jpg',
  },
];

const whoNeedsDot = [
  { role: 'CDL Truck Drivers', desc: 'Interstate and intrastate commercial drivers' },
  { role: 'Bus Drivers', desc: 'School bus and transit operators' },
  { role: 'Pipeline Workers', desc: 'Natural gas and hazardous liquid pipeline employees' },
  { role: 'Railroad Workers', desc: 'Train operators and dispatchers' },
  { role: 'Aviation Workers', desc: 'Pilots, flight attendants, mechanics' },
  { role: 'Maritime Workers', desc: 'Commercial vessel crew members' },
];

export default function DotTestingPage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Drug Testing", href: "/drug-testing" }, { label: "Dot Testing" }]} />
      </div>
{/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/pages/drug-testing-page-1.jpg" alt="DOT Drug Testing for Commercial Drivers" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">DOT Drug & Alcohol Testing</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">FMCSA-compliant testing for CDL drivers and DOT-regulated employees. Full compliance with 49 CFR Part 40.</p>
          </div>
        </div>
      </section>

      {/* What is DOT Testing */}
      <section className="py-12 bg-brand-orange-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What is DOT Testing?</h2>
              <p className="text-gray-700 mb-4">
                DOT (Department of Transportation) drug and alcohol testing is <strong>federally mandated</strong> for 
                employees in safety-sensitive transportation positions. It follows strict regulations under 49 CFR Part 40.
              </p>
              <p className="text-gray-700 mb-4">
                Unlike standard workplace testing, DOT testing has specific requirements for:
              </p>
              <ul className="space-y-2">
                {[
                  'Collection procedures and chain of custody',
                  'Laboratory certification (SAMHSA)',
                  'Medical Review Officer (MRO) review',
                  'Clearinghouse reporting',
                  'Specific 5-panel drug test (no variations)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-gray-700">
                    <FileCheck className="w-5 h-5 text-brand-orange-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-orange-500" />
                Who Needs DOT Testing?
              </h3>
              <div className="grid gap-3">
                {whoNeedsDot.map((item) => (
                  <div key={item.role} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <div>
                      <div className="font-medium text-gray-900">{item.role}</div>
                      <div className="text-sm text-gray-600">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Note */}
      <section className="py-4 bg-amber-50 border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-amber-900 font-medium text-center">
            <strong>All prices are per person</strong> — includes DOT-compliant collection, lab analysis, MRO review, and Clearinghouse reporting.
          </p>
        </div>
      </section>

      {/* Tests Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">DOT Testing Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dotTests.map((test) => (
              <div
                key={test.name}
                className={`bg-white rounded-xl overflow-hidden shadow-lg border-2 ${test.popular ? 'border-brand-orange-500' : 'border-gray-200'}`}
              >
                <div className="relative h-40">
                  <Image
                    src={test.image}
                    alt={test.name}
                    fill
                    className="object-cover"
                  />
                  {test.popular && (
                    <div className="absolute top-3 left-3 bg-brand-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      MOST COMMON
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                    ${test.price}/person
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{test.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{test.description}</p>
                  
                  <ul className="space-y-1 mb-4">
                    {test.includes.slice(0, 4).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  
                  <a
                    href="/support"
                    className="block w-full text-center bg-brand-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-orange-600 transition text-sm"
                  >
                    Schedule Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Violation Warning */}
      <section className="py-12 bg-brand-red-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-brand-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Had a DOT Violation?</h3>
              <p className="text-gray-700 mb-4">
                If you've had a positive drug test, refused a test, or violated DOT drug and alcohol regulations, 
                you must complete the return-to-duty process before resuming safety-sensitive duties.
              </p>
              <p className="text-gray-700 mb-4">
                This includes evaluation by a Substance Abuse Professional (SAP), completing recommended treatment, 
                and passing a return-to-duty test under direct observation.
              </p>
              <a
                href="/support"
                className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-red-700 transition"
              >
                <Phone className="w-4 h-4" />
                Get Help Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Random Consortium */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">DOT Random Testing Consortium</h2>
              <p className="text-gray-300 mb-6">
                Owner-operators and small fleets can join our random testing consortium to meet DOT requirements 
                without the hassle of managing your own program.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Meets FMCSA random testing requirements',
                  'Computer-generated random selections',
                  'Nationwide collection sites',
                  'Full compliance documentation',
                  'Clearinghouse reporting included',
                  'Affordable monthly rates',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-300">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="/support"
                className="inline-flex items-center gap-2 bg-brand-orange-500 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-orange-600 transition"
              >
                <Phone className="w-5 h-5" />
                Join Consortium
              </a>
            </div>
            <div className="relative h-[350px] rounded-2xl overflow-hidden">
              <Image
                src="/images/pages/drug-testing-page-1.jpg"
                alt="DOT Random Testing Consortium"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Need DOT-Compliant Testing?</h2>
          <p className="text-xl text-brand-orange-100 mb-8">
            We ensure full compliance with all FMCSA regulations. Schedule online for same-day appointments.
          </p>
          <a
            href="/support"
            className="inline-flex items-center gap-2 bg-white text-brand-orange-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition text-lg"
          >
            <Phone className="w-5 h-5" />
            Get Help Online
          </a>
        </div>
      </section>
    </div>
  );
}
