
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, ArrowRight, Clock, MapPin, Shield, Beaker, Truck, Building2, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Drug Testing Services | Elevate for Humanity',
  description:
    'Professional drug testing for employers and individuals. DOT and non-DOT testing, 20,000+ nationwide locations, fast results.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/drug-testing',
  },
};

const testingCategories = [
  {
    title: 'Urine Drug Tests',
    description: 'Most common and cost-effective. Lab-confirmed results in 24-48 hours.',
    href: '/drug-testing/urine-tests',
    image: '/images/trades/program-electrical-training.jpg',
    startingPrice: 69,
    tests: ['5-Panel', '10-Panel', 'DOT 5-Panel', 'Expanded Opiates'],
  },
  {
    title: 'Instant Rapid Tests',
    description: 'On-site results in 5-10 minutes. Perfect for high-volume screening.',
    href: '/drug-testing/instant-tests',
    image: '/images/trades/program-welding-training.jpg',
    startingPrice: 60,
    tests: ['Rapid 5-Panel', 'Rapid 10-Panel', 'Rapid + Alcohol'],
  },
  {
    title: 'Hair Follicle Tests',
    description: '90-day detection window. Difficult to cheat, ideal for pre-employment.',
    href: '/drug-testing/hair-tests',
    image: '/images/courses/esthetician-client-services-10002415-cover.jpg',
    startingPrice: 125,
    tests: ['5-Panel Hair', '10-Panel Hair', 'Extended Opiates'],
  },
  {
    title: 'DOT Testing',
    description: 'FMCSA-compliant testing for commercial drivers and transportation workers.',
    href: '/drug-testing/dot-testing',
    image: '/images/courses/business-startup-marketing-10002422-cover.jpg',
    startingPrice: 75,
    tests: ['Pre-Employment', 'Random', 'Post-Accident', 'Return to Duty'],
  },
  {
    title: 'Training & Certification',
    description: 'Online courses for supervisors, collectors, and employers. DOT-compliant certificates.',
    href: '/drug-testing/training',
    image: '/images/courses/home-health-aide-10002413-cover.jpg',
    startingPrice: 22,
    tests: ['Supervisor Training', 'Collector Certification', 'DER Training'],
  },
];

const features = [
  {
    icon: MapPin,
    title: '20,000+ Locations',
    description: 'LabCorp, Quest, and clinic sites nationwide. Find one near you.',
  },
  {
    icon: Clock,
    title: 'Fast Results',
    description: 'Most results in 24-48 hours. Instant tests in 5-10 minutes.',
  },
  {
    icon: Shield,
    title: 'MRO Review Included',
    description: 'Licensed Medical Review Officer reviews every result.',
  },
  {
    icon: Beaker,
    title: 'SAMHSA Certified',
    description: 'All lab testing meets federal certification standards.',
  },
];

export default function DrugTestingLandingPage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Drug Testing" }]} />
      </div>
{/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/healthcare/hero-programs-healthcare.jpg" alt="Professional Drug Testing Services" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Professional Drug Testing Services</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Fast, accurate, and affordable drug testing for employers and individuals. DOT and non-DOT options with nationwide collection sites.</p>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="py-8 bg-brand-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">{feature.title}</h3>
                  <p className="text-sm text-brand-blue-200">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Note */}
      <section className="py-6 bg-amber-50 border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-amber-900 font-medium">
            <strong>All prices are per person</strong> and include collection, lab analysis, MRO review, and electronic results delivery.
          </p>
        </div>
      </section>

      {/* Testing Categories */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Test Type
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We offer a full range of drug testing options to meet your needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {testingCategories.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-xl transition-all"
              >
                <div className="relative h-48">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                      From ${category.startingPrice}/person
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-brand-blue-600 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {category.tests.map((test) => (
                      <span key={test} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {test}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center text-brand-blue-600 font-bold">
                    View Tests & Pricing
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Employer Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image
                src="/images/courses/barber-apprenticeship-10002417-cover.jpg"
                alt="Employer Drug Testing Programs"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-blue-100 text-brand-blue-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
                <Building2 className="w-4 h-4" />
                For Employers
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Employer Drug Testing Programs
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Comprehensive drug testing solutions for businesses of all sizes. Volume discounts available.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Pre-employment screening',
                  'Random testing programs',
                  'Post-accident testing',
                  'Reasonable suspicion testing',
                  'DOT compliance programs',
                  'Dedicated account manager',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/drug-testing/employer-programs"
                className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-700 transition"
              >
                <Users className="w-5 h-5" />
                Set Up Employer Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DOT Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-orange-500 px-4 py-2 rounded-full text-sm font-bold mb-4">
                <Truck className="w-4 h-4" />
                DOT Compliant
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                DOT Drug & Alcohol Testing
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                FMCSA-compliant testing for CDL drivers and DOT-regulated employees. 
                Full compliance with 49 CFR Part 40.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Pre-employment DOT testing',
                  'Random testing consortium',
                  'Post-accident testing',
                  'Return-to-duty & follow-up',
                  'Clearinghouse reporting',
                  'SAP referrals available',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-300">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/drug-testing/dot-testing"
                className="inline-flex items-center gap-2 bg-brand-orange-500 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-orange-600 transition"
              >
                DOT Testing Details
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image
                src="/images/courses/hvac-technician-10002289-cover.jpg"
                alt="DOT Drug Testing for Commercial Drivers"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
            How It Works
          </h2>
          <div className="space-y-8">
            {[
              { step: 1, title: 'Order Your Test', desc: 'Call Get Help Online or order online. We confirm your test type and send collection authorization.' },
              { step: 2, title: 'Visit Collection Site', desc: 'Go to any of our 20,000+ nationwide locations. Bring valid photo ID. Walk-ins welcome at most sites.' },
              { step: 3, title: 'Sample Collection', desc: 'Trained collector obtains your sample following proper chain of custody procedures.' },
              { step: 4, title: 'Lab Analysis', desc: 'Sample sent to SAMHSA-certified lab. Positive screens confirmed with GC/MS testing.' },
              { step: 5, title: 'MRO Review', desc: 'Medical Review Officer reviews results. Contacts donor if prescription verification needed.' },
              { step: 6, title: 'Results Delivered', desc: 'Receive results via secure portal and email. Most results in 24-48 hours.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-6">
                <div className="w-14 h-14 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  {item.step}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Schedule a Drug Test?
          </h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Schedule online for same-day appointments at locations near you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition text-lg"
            >
              <Phone className="w-5 h-5" />
              Get Help Online
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-700 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-800 transition text-lg border-2 border-white"
            >
              Request Quote
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
