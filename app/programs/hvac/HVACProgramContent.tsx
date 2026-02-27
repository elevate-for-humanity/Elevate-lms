'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';

export default function HVACProgramContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Video Hero Banner */}
      <ProgramHeroBanner videoSrc="/videos/hvac-technician.mp4" voiceoverSrc="/audio/heroes/skilled-trades.mp3" />

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
              { name: 'Residential HVAC Cert 1', issuer: 'Elevate for Humanity Career & Technical Institute' },
              { name: 'Residential HVAC Cert 2', issuer: 'Elevate for Humanity Career & Technical Institute' },
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

      {/* Funding */}
      <section className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Funding</h2>
          <p className="text-gray-600 mb-6">Most students pay nothing out of pocket. Here is exactly how to get started.</p>

          <ol className="space-y-4 mb-10">
            {/* Step 1 */}
            <li className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-600 text-white font-bold flex items-center justify-center text-sm">1</span>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Register at Indiana Career Connect</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Create a free account at the state workforce portal. This is required before you can
                    be referred to any WIOA-funded training program. Takes about 10 minutes.
                  </p>
                  <Link
                    href="https://indianacareerconnect.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-bold py-2 px-5 rounded-lg transition"
                  >
                    Go to Indiana Career Connect →
                  </Link>
                </div>
              </div>
            </li>

            {/* Step 2 */}
            <li className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-600 text-white font-bold flex items-center justify-center text-sm">2</span>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Visit WorkOne Indy and Meet with a Career Coach</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Walk in or call to schedule an appointment. Tell them you want to enroll in
                    HVAC Technician Training at Elevate for Humanity. They will determine your
                    eligibility for WIOA or the Indiana Workforce Ready Grant and complete the paperwork.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 mb-3">
                    <p className="font-bold text-gray-900 text-sm">WorkOne Indy — Southeast</p>
                    <p className="text-sm text-gray-600">2511 E. 46th Street, Suite N, Indianapolis, IN 46205</p>
                    <p className="text-sm text-gray-600">Phone: <Link href="tel:+13178908800" className="text-brand-blue-600 hover:underline">(317) 890-8800</Link></p>
                    <p className="text-sm text-gray-600">Hours: Mon–Fri, 8:00 AM – 4:30 PM</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="https://www.workoneindy.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-bold py-2 px-5 rounded-lg transition"
                    >
                      WorkOne Indy Website →
                    </Link>
                    <Link
                      href="https://maps.google.com/?q=2511+E+46th+Street+Suite+N+Indianapolis+IN+46205"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block border-2 border-gray-300 hover:border-gray-400 text-gray-900 text-sm font-bold py-2 px-5 rounded-lg transition"
                    >
                      Get Directions →
                    </Link>
                  </div>
                </div>
              </div>
            </li>

            {/* Step 3 */}
            <li className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-600 text-white font-bold flex items-center justify-center text-sm">3</span>
                <div>
                  <p className="font-bold text-gray-900 mb-1">Apply to Our Program</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Once WorkOne approves your funding, apply on our site. We coordinate directly
                    with WorkOne to confirm your enrollment and funding. Once everything is approved,
                    you start training with your cohort.
                  </p>
                  <Link
                    href="/apply/student?program=hvac-technician"
                    className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-bold py-2 px-5 rounded-lg transition"
                  >
                    Apply for Enrollment →
                  </Link>
                </div>
              </div>
            </li>
          </ol>

          {/* Self-pay note */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-gray-900">Self-pay option:</span> If you don&apos;t qualify for workforce funding,
              tuition is $5,000 with weekly payment plans available. Contact us at{' '}
              <Link href="tel:+13173143757" className="text-brand-blue-600 hover:underline">(317) 314-3757</Link> to discuss options.
            </p>
          </div>
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
