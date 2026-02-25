'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function HVACProgramContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Hero */}
      <section className="relative h-[300px] sm:h-[400px] md:h-[480px]">
        <Image
          src="/images/trades/hero-program-hvac.jpg"
          alt="HVAC technician servicing a commercial air conditioning unit"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Skilled Trades', href: '/programs/skilled-trades' },
            { label: 'HVAC Technician' },
          ]} />
        </div>
      </div>

      {/* Program Overview + CTA */}
      <section className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">HVAC Technician Training</h1>

          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            15-week program. 160 clock hours — 110 classroom, 50 on-the-job training.
            Graduate with 6 industry credentials. Most students qualify for full tuition
            coverage through WIOA or the Indiana Workforce Ready Grant.
          </p>

          {/* Key Details */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Duration', value: '15 Weeks' },
              { label: 'Clock Hours', value: '160 Hours' },
              { label: 'Credentials', value: '6 Included' },
              { label: 'Self-Pay', value: '$5,000' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-xl font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons — framed cards with button inside */}
          <div className="grid sm:grid-cols-2 gap-6 mb-4">
            <div className="rounded-xl border-2 border-brand-blue-600 bg-brand-blue-50 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to enroll?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create your account, select your program, and start onboarding.
                Our admissions team will contact you about funding.
              </p>
              <Link
                href="/apply/student?program=hvac-technician"
                className="inline-block w-full text-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                Apply for Enrollment
              </Link>
            </div>
            <div className="rounded-xl border-2 border-gray-200 bg-white p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Have questions first?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Submit an inquiry and our admissions team will contact you
                within 1 business day about the program, schedule, and funding.
              </p>
              <Link
                href="/apply/intake?program=hvac-technician"
                className="inline-block w-full text-center border-2 border-gray-300 hover:border-gray-400 text-gray-900 font-bold py-3 px-6 rounded-lg transition"
              >
                Submit an Inquiry
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What You Will Learn */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">What You Will Learn</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'HVAC Fundamentals', desc: 'System types, components, heating and cooling principles.', img: '/images/trades/program-hvac-overview.jpg', alt: 'HVAC system overview and components' },
              { title: 'Electrical for HVAC', desc: 'Wiring diagrams, circuit testing, motor controls, and schematics.', img: '/images/trades/program-electrical-training.jpg', alt: 'Electrical wiring and circuit components for HVAC systems' },
              { title: 'Refrigerant Handling', desc: 'EPA 608 prep — recovery, recycling, reclamation, and federal regs.', img: '/images/programs-hq/hvac-technician.jpg', alt: 'Technician handling refrigerant gauges on an HVAC unit' },
              { title: 'Installation & Service', desc: 'Equipment sizing, ductwork, brazing, startup, and maintenance.', img: '/images/trades/program-hvac-technician.jpg', alt: 'HVAC technician installing ductwork and equipment' },
              { title: 'Troubleshooting', desc: 'Diagnose failures using gauges, meters, and diagnostic tools.', img: '/images/trades/program-building-technology.jpg', alt: 'Technician using diagnostic tools on building systems' },
              { title: 'Safety & Compliance', desc: 'OSHA 30, lockout/tagout, fall protection, confined spaces.', img: '/images/programs-hq/skilled-trades-hero.jpg', alt: 'Skilled trades workers following safety protocols on a job site' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="relative h-40">
                  <Image src={item.img} alt={item.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials — simple list, no images */}
      <section className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">6 Credentials Included</h2>
          <p className="text-gray-600 mb-6">Every certification Indiana HVAC employers require for hiring.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: 'EPA 608 Universal', issuer: 'EPA-approved organization' },
              { name: 'Residential HVAC Cert 1', issuer: 'Elevate for Humanity' },
              { name: 'Residential HVAC Cert 2', issuer: 'Elevate for Humanity' },
              { name: 'OSHA 30 Safety', issuer: 'Dept. of Labor' },
              { name: 'CPR / First Aid', issuer: 'American Heart Assoc.' },
              { name: 'NRF Rise Up', issuer: 'National Retail Federation' },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="w-2 h-2 rounded-full bg-brand-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.issuer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career + Salary — compact */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Career Outcomes</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Entry-Level Positions</h3>
              <ul className="space-y-1 text-gray-700 text-sm">
                <li>HVAC Service Technician</li>
                <li>HVAC Installation Technician</li>
                <li>Maintenance Technician</li>
                <li>Refrigeration Technician</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Salary</h3>
              <p className="text-sm text-gray-700 mb-3">
                Entry: $18–$22/hr ($38K–$46K/yr).
                Experienced: $60K–$80K+.
              </p>
              <h3 className="font-bold text-gray-900 mb-3">Demand</h3>
              <p className="text-sm text-gray-700">
                HVAC is a 4-Star Indiana Top Job. Employers hiring across Central Indiana.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Funding — compact */}
      <section className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Funding</h2>
          <p className="text-gray-600 mb-6">Most students pay nothing out of pocket.</p>
          <ol className="space-y-3">
            {[
              { step: '1', title: 'Register at Indiana Career Connect', desc: 'Free account at indianacareerconnect.com. Takes 10 minutes.' },
              { step: '2', title: 'Meet with a WorkOne Career Coach', desc: 'They determine your WIOA or Workforce Ready Grant eligibility.' },
              { step: '3', title: 'Apply to Our Program', desc: 'We coordinate with WorkOne. Once approved, you start with your cohort.' },
            ].map((s) => (
              <li key={s.step} className="flex gap-4 items-start bg-gray-50 rounded-xl p-5 border border-gray-200">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-600 text-white font-bold flex items-center justify-center text-sm">{s.step}</span>
                <div>
                  <p className="font-bold text-gray-900">{s.title}</p>
                  <p className="text-sm text-gray-600">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">FAQ</h2>
          <div className="space-y-2">
            {[
              { q: 'Do I need experience?', a: 'No. Built for complete beginners.' },
              { q: 'How long is the program?', a: '15 weeks — 110 hours classroom, 50 hours on-the-job training.' },
              { q: 'How much does it cost?', a: 'Free with WIOA or Workforce Ready Grant. Self-pay: $5,000 with payment plans.' },
              { q: 'What certifications do I get?', a: 'EPA 608, Residential HVAC 1 & 2, OSHA 30, CPR/First Aid, Rise Up.' },
              { q: 'Can I work while in the program?', a: 'Yes. Day and evening options. Most students keep their current job.' },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-semibold text-gray-900 text-sm">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-600">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-slate-900 py-14">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Start Your HVAC Career</h2>
          <p className="text-gray-400 mb-8">Apply now or ask us a question first.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply/student?program=hvac-technician"
              className="inline-block bg-white text-slate-900 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition text-center"
            >
              Apply for Enrollment
            </Link>
            <Link
              href="/apply/intake?program=hvac-technician"
              className="inline-block border-2 border-white/30 text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition text-center"
            >
              Submit an Inquiry
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
