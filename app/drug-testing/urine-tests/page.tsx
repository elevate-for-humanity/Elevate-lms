
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, ArrowLeft, Clock, Beaker } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Urine Drug Tests | Drug Testing Services',
  description: 'Lab-based urine drug testing. 5-panel, 10-panel, DOT, and expanded opiate tests. Results in 24-48 hours.',
};

const urineTests = [
  {
    name: 'DOT 5-Panel Urine Test',
    price: 89,
    popular: true,
    description: 'Required for CDL drivers and DOT-regulated employees.',
    includes: [
      'DOT-compliant collection procedure',
      '5-panel screen: THC, Cocaine, Opiates, Amphetamines, PCP',
      'SAMHSA-certified laboratory analysis',
      'MRO (Medical Review Officer) review',
      'Electronic results via secure portal',
      'Chain of custody documentation',
      'Clearinghouse reporting (if applicable)',
    ],
    turnaround: '24-48 hours',
    image: '/images/pages/testing-page-1.jpg',
  },
  {
    name: '5-Panel Drug Test',
    price: 79,
    description: 'Standard workplace drug screening for most employers.',
    includes: [
      'Standard urine collection',
      '5-panel screen: THC, Cocaine, Opiates, Amphetamines, PCP',
      'Lab confirmation of any positive results',
      'MRO review included',
      'Results via secure online portal',
      'Email notification when ready',
    ],
    turnaround: '24-48 hours',
    image: '/images/pages/comp-home-highlight-biz.jpg',
  },
  {
    name: '10-Panel Drug Test',
    price: 79,
    description: 'Expanded screening for comprehensive drug detection.',
    includes: [
      'Tests for 10 substance categories',
      'Includes: THC, Cocaine, Opiates, Amphetamines, PCP',
      'Plus: Benzodiazepines, Barbiturates, Methadone, Propoxyphene, Quaaludes',
      'Lab confirmation of positives',
      'MRO review included',
      'Detailed results report',
    ],
    turnaround: '24-48 hours',
    image: '/images/pages/comp-home-highlight-biz.jpg',
  },
  {
    name: '5-Panel + Expanded Opiates',
    price: 89,
    description: 'Enhanced opioid detection including fentanyl and synthetics.',
    includes: [
      'Standard 5-panel drug screen',
      'Expanded opiate panel adds:',
      '• Fentanyl and fentanyl analogs',
      '• Oxycodone (OxyContin, Percocet)',
      '• Hydrocodone (Vicodin, Norco)',
      '• Hydromorphone, Oxymorphone',
      'MRO review included',
    ],
    turnaround: '24-48 hours',
    image: '/images/pages/comp-home-highlight-biz.jpg',
  },
  {
    name: '4-Panel (NO THC)',
    price: 89,
    description: 'THC-free option for states with legal cannabis.',
    includes: [
      'Tests: Cocaine, Opiates, Amphetamines, PCP',
      'Does NOT test for marijuana/THC',
      'Ideal for employers in legal cannabis states',
      'Compliant with state employment laws',
      'MRO review included',
      'Same fast turnaround',
    ],
    turnaround: '24-48 hours',
    image: '/images/pages/hvac-technician.jpg',
  },
  {
    name: '5-Panel + Alcohol',
    price: 99,
    description: 'Drug and alcohol screening in one visit.',
    includes: [
      'Standard 5-panel drug test',
      'Breath alcohol test (BAT) OR',
      'Urine alcohol (EtG) test option',
      'Detects recent alcohol consumption',
      'MRO review for drug portion',
      'Combined results report',
    ],
    turnaround: '24-48 hours',
    image: '/images/pages/hvac-technician.jpg',
  },
];

export default function UrineTestsPage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Drug Testing", href: "/drug-testing" }, { label: "Urine Tests" }]} />
      </div>
{/* Hero */}
      <section className="relative py-20 bg-brand-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/drug-testing" className="inline-flex items-center gap-2 text-white hover:text-white mb-6 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Drug Testing
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Urine Drug Tests</h1>
          <p className="text-xl text-white max-w-2xl">
            Lab-based urine testing is the most common and cost-effective method for workplace drug screening. 
            Results typically in 24-48 hours.
          </p>
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

      {/* Tests Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid gap-8">
            {urineTests.map((test) => (
              <div
                key={test.name}
                className={`bg-white rounded-2xl overflow-hidden shadow-sm border-2 ${test.popular ? 'border-brand-blue-500' : 'border-gray-200'}`}
              >
                <div className="grid lg:grid-cols-3">
                  {/* Image */}
                  <div className="relative h-64 lg:h-auto">
                    <Image
                      src={test.image}
                      alt={test.name}
                      fill
                      className="object-cover"
                     sizes="100vw" />
                    {test.popular && (
                      <div className="absolute top-4 left-4 bg-brand-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        MOST POPULAR
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
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
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {test.turnaround}
                      </span>
                      <span className="flex items-center gap-1">
                        <Beaker className="w-4 h-4" />
                        Lab Confirmed
                      </span>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-bold text-gray-900 mb-3">What's Included:</h3>
                      <ul className="grid md:grid-cols-2 gap-2">
                        {test.includes.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <span className="text-slate-500 flex-shrink-0">•</span>
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-6 flex flex-wrap gap-4">
                      <a
                        href="/contact?service=drug-testing"
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

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Help Choosing?</h2>
          <p className="text-xl text-white mb-8">
            Contact us and we'll recommend the right test for your situation.
          </p>
          <a
            href="tel:+13173143757"
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
