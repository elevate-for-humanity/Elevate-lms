'use client';

import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Clock,
  DollarSign,
  GraduationCap,
  MapPin,

  ArrowRight,

  Shield,
  Users,
  Calendar,
} from 'lucide-react';

export default function CNAProgramPage() {
  const highlights = [
    { icon: Clock, label: 'Duration', value: '4–8 weeks' },
    { icon: DollarSign, label: 'Tuition', value: '$1,200' },
    { icon: GraduationCap, label: 'Credential', value: 'Indiana CNA License' },
    { icon: MapPin, label: 'Location', value: 'Indianapolis, IN' },
  ];

  const curriculum = [
    'Patient care fundamentals and safety',
    'Vital signs measurement and documentation',
    'Infection control and hygiene procedures',
    'Mobility assistance and body mechanics',
    'Nutrition and feeding assistance',
    'Communication with patients and healthcare teams',
    'Clinical rotation at a licensed healthcare facility',
    'Indiana State CNA competency exam preparation',
  ];

  const outcomes = [
    { employer: 'Hospitals', pay: '$16–$20/hr' },
    { employer: 'Nursing homes / Long-term care', pay: '$15–$19/hr' },
    { employer: 'Home health agencies', pay: '$14–$18/hr' },
    { employer: 'Rehabilitation centers', pay: '$16–$20/hr' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'CNA Certification' }]} />
      </div>

      {/* Video Hero */}
      <ProgramHeroBanner videoSrc="/videos/cna-hero.mp4" />

      {/* Hero Image — no text overlay */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image
          src="/images/programs-hq/cna-training.jpg"
          alt="CNA training classroom with students practicing patient care"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </section>

      {/* Quick Stats */}
      <section className="bg-slate-50 border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.label} className="flex items-center gap-3">
                  <Icon className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{h.label}</p>
                    <p className="font-bold text-gray-900">{h.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Program Overview */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Program Overview</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The CNA Certification program prepares you for employment as a Certified Nursing
                Assistant in hospitals, nursing homes, home health agencies, and rehabilitation
                centers across Indiana.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Training includes classroom instruction, skills lab practice, and supervised
                clinical hours at a licensed healthcare facility. Upon completion, you are
                eligible to sit for the Indiana State CNA competency examination administered
                by the Indiana State Department of Health (ISDH).
              </p>
              <p className="text-gray-600 text-sm">
                The CNA credential is issued by the Indiana State Department of Health upon
                passing the state competency exam. Elevate provides training and exam preparation
                but does not independently issue the CNA license.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">What You&apos;ll Learn</h3>
              <ul className="space-y-3">
                {curriculum.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-brand-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Options */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Tuition &amp; Payment Options</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border p-6 text-center">
              <DollarSign className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Pay in Full</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">$1,200</p>
              <p className="text-gray-600 text-sm">One-time payment at enrollment</p>
            </div>
            <div className="bg-white rounded-xl border-2 border-brand-blue-500 p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </div>
              <Calendar className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Payment Plan</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">$200 <span className="text-base font-normal text-gray-500">down</span></p>
              <p className="text-gray-600 text-sm">Then $50/week for 20 weeks</p>
            </div>
            <div className="bg-white rounded-xl border p-6 text-center">
              <Shield className="w-10 h-10 text-brand-green-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Workforce Funding</h3>
              <p className="text-3xl font-bold text-brand-green-600 mb-2">$0</p>
              <p className="text-gray-600 text-sm">WIOA, JRI, or employer-sponsored — if eligible</p>
            </div>
          </div>
        </div>
      </section>

      {/* Career Outcomes */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Career Outcomes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {outcomes.map((o) => (
              <div key={o.employer} className="flex items-center justify-between bg-slate-50 rounded-lg p-4 border">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-brand-blue-600" />
                  <span className="font-medium text-gray-900">{o.employer}</span>
                </div>
                <span className="font-bold text-brand-green-600">{o.pay}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-4">
            Salary ranges are estimates based on Indiana labor market data. Actual pay varies by employer and experience.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Healthcare Career?
          </h2>
          <p className="text-brand-blue-100 mb-8 max-w-2xl mx-auto">
            Enroll today or check your eligibility for funded training. Classes start regularly with day, evening, and weekend options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply/student?program=cna-certification"
              className="bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply for Enrollment
            </Link>
            <Link
              href="/apply/intake?program=cna-certification"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-700 transition"
            >
              Request Information
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
