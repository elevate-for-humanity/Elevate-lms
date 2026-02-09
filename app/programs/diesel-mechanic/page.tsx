// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Clock, DollarSign, Award, Wrench, Truck, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Diesel Mechanic Training | Elevate for Humanity',
  description: 'Learn diesel engine repair and maintenance. Self-paced training program with industry certification.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/diesel-mechanic',
  },
};

const APPLY_LINK = '/programs/diesel-mechanic/apply';

export default function DieselMechanicPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative w-full h-[50vh] sm:h-[60vh]">
        <div className="absolute inset-0">
          <Image
            src="/images/trades/hero-program-cdl.jpg"
            alt="Diesel Mechanic Training"
            fill sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 flex items-end">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
            <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
              Self-Pay Program
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Diesel Mechanic Training
            </h1>
            <p className="text-lg sm:text-xl text-white max-w-2xl drop-shadow-md">
              Master diesel engine diagnostics, repair, and maintenance
            </p>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumbs items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Skilled Trades', href: '/programs/skilled-trades' },
          { label: 'Diesel Mechanic' }
        ]} />
      </div>

      {/* Program Overview */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Program Overview</h2>
              <p className="text-slate-600 mb-6">
                Our Diesel Mechanic Training program provides hands-on instruction in diesel engine 
                systems, diagnostics, and repair. Learn to work on commercial trucks, buses, 
                construction equipment, and agricultural machinery.
              </p>
              
              <h3 className="text-xl font-bold text-slate-900 mb-4">What You Will Learn</h3>
              <ul className="space-y-3 mb-8">
                {[
                  'Diesel engine fundamentals and theory',
                  'Fuel injection systems and diagnostics',
                  'Electrical systems and troubleshooting',
                  'Brake systems and hydraulics',
                  'Preventive maintenance procedures',
                  'Emissions systems and compliance',
                  'Computer diagnostics and scan tools',
                  'Safety protocols and best practices',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>

              <h3 className="text-xl font-bold text-slate-900 mb-4">Career Opportunities</h3>
              <p className="text-slate-600 mb-4">
                Diesel mechanics are in high demand across multiple industries. Graduates can pursue careers as:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  'Fleet Maintenance Technician',
                  'Heavy Equipment Mechanic',
                  'Truck Service Technician',
                  'Bus Maintenance Specialist',
                  'Agricultural Equipment Tech',
                  'Marine Diesel Mechanic',
                ].map((career, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-700">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    {career}
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar - Enrollment Card */}
            <div className="lg:col-span-1">
              <div className="bg-slate-50 rounded-2xl p-6 sticky top-24">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Program Details</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-500">Duration</p>
                      <p className="font-semibold text-slate-900">12 Weeks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-500">Tuition</p>
                      <p className="font-semibold text-slate-900">$4,500</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-500">Certification</p>
                      <p className="font-semibold text-slate-900">Industry Certificate</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-500">Format</p>
                      <p className="font-semibold text-slate-900">Hands-On Training</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Self-Pay Program:</strong> This program is not covered by workforce funding. 
                    Payment plans available.
                  </p>
                </div>

                <a
                  href={APPLY_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 text-white text-center py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors mb-3"
                >
                  Enroll Now - $4,500
                </a>
                
                <Link
                  href="/contact?program=diesel-mechanic"
                  className="block w-full bg-white text-blue-600 text-center py-4 rounded-full font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Request Information
                </Link>

                <p className="text-xs text-slate-500 text-center mt-4">
                  Payment plans available. Contact us for details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Your Diesel Mechanic Career?</h2>
          <p className="text-blue-100 mb-6">Enroll today and begin your journey to a rewarding career in diesel technology.</p>
          <a
            href={APPLY_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-blue-600 px-8 py-3 font-semibold rounded-full hover:bg-blue-50 transition-colors"
          >
            Enroll Now
          </a>
        </div>
      </section>
    </div>
  );
}
