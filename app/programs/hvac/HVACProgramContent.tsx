'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function HVACProgramContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const router = useRouter();

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

      {/* Program Overview */}
      <section className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">HVAC Technician Training</h1>

          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            This 15-week program prepares you for entry-level HVAC employment. You will learn to install,
            maintain, troubleshoot, and repair residential and light commercial heating, ventilation, and
            air conditioning systems. Training includes 110 hours of classroom instruction and 50 hours
            of supervised on-the-job training at employer partner sites in Indianapolis.
          </p>

          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            You graduate with 6 industry credentials: EPA 608 Universal Certification (required by federal
            law to handle refrigerants), Residential HVAC Certification 1 &amp; 2, OSHA 30 Safety, CPR/First
            Aid, and NRF Rise Up. These are the credentials Indiana HVAC employers require for hiring.
          </p>

          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            Most students qualify for full tuition coverage through WIOA (Workforce Innovation and Opportunity
            Act) or the Indiana Workforce Ready Grant. If you qualify, there is no cost to you — tuition,
            books, and supplies are covered. Self-pay tuition is $5,000 with weekly payment plans available.
          </p>

          {/* Key Details */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Duration', value: '15 Weeks' },
              { label: 'Clock Hours', value: '160 Hours' },
              { label: 'Credentials', value: '6 Included' },
              { label: 'Delivery', value: 'Classroom + OJT' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                <p className="text-lg font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="grid sm:grid-cols-2 gap-6 mb-4">
            <button
              onClick={() => router.push('/apply/student?program=hvac-technician')}
              className="text-left bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-xl p-6 transition cursor-pointer"
            >
              <span className="text-xl font-bold block mb-2">Apply for Enrollment</span>
              <span className="text-sm text-blue-100 block leading-relaxed">
                Ready to start training? Complete your enrollment application to create an account,
                upload your documents, and begin onboarding. Our admissions team will review your
                application and contact you about funding eligibility.
              </span>
            </button>
            <button
              onClick={() => router.push('/apply/intake?program=hvac-technician')}
              className="text-left border-2 border-gray-200 hover:border-gray-300 rounded-xl p-6 transition cursor-pointer"
            >
              <span className="text-xl font-bold text-gray-900 block mb-2">Submit an Inquiry</span>
              <span className="text-sm text-gray-500 block leading-relaxed">
                Have questions before you apply? Submit an inquiry and our admissions team will
                contact you within 1 business day. We can answer questions about the program,
                schedule, funding options, and what to expect.
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* What You Will Learn */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">What You Will Learn</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'HVAC Fundamentals', desc: 'Heating, ventilation, air conditioning, and refrigeration principles. System types, components, and how they work together.', img: '/images/trades/program-hvac-overview.jpg', alt: 'HVAC system overview and components' },
              { title: 'Electrical for HVAC', desc: 'Wiring diagrams, circuit testing, motor controls, and electrical safety. Read schematics and troubleshoot electrical faults.', img: '/images/trades/electrical.jpg', alt: 'Electrical wiring and circuit components for HVAC systems' },
              { title: 'Refrigerant Handling', desc: 'EPA 608 exam prep — refrigerant types, recovery, recycling, and reclamation. Federal regulations and safe handling procedures.', img: '/images/programs-hq/hvac-technician.jpg', alt: 'Technician handling refrigerant gauges on an HVAC unit' },
              { title: 'Installation & Service', desc: 'Equipment sizing, ductwork layout, brazing, system startup, and preventive maintenance using real equipment.', img: '/images/trades/program-hvac-technician.jpg', alt: 'HVAC technician installing ductwork and equipment' },
              { title: 'Troubleshooting', desc: 'Systematic diagnosis of heating and cooling failures. Use gauges, meters, and diagnostic tools to isolate problems.', img: '/images/trades/program-building-technology.jpg', alt: 'Technician using diagnostic tools on building systems' },
              { title: 'Safety & Compliance', desc: 'OSHA 30 certification, lockout/tagout, fall protection, confined spaces, and job site safety protocols.', img: '/images/programs-hq/skilled-trades-hero.jpg', alt: 'Skilled trades workers following safety protocols on a job site' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="relative h-44">
                  <Image
                    src={item.img}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Credentials You Earn</h2>
          <p className="text-gray-600 mb-8">Graduate with every certification Indiana HVAC employers require for hiring.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'EPA 608 Universal Certification', issuer: 'EPA-approved certifying organization', img: '/images/programs-hq/hvac-technician.jpg', alt: 'Technician working with refrigerant gauges' },
              { name: 'Residential HVAC Certification 1', issuer: 'Elevate for Humanity', img: '/images/trades/program-hvac-overview.jpg', alt: 'Residential HVAC system components' },
              { name: 'Residential HVAC Certification 2', issuer: 'Elevate for Humanity', img: '/images/trades/program-hvac-technician.jpg', alt: 'HVAC technician performing advanced service' },
              { name: 'OSHA 30 Safety Certification', issuer: 'OSHA / Department of Labor', img: '/images/trades/program-construction-training.jpg', alt: 'Workers following safety protocols on a construction site' },
              { name: 'CPR / First Aid', issuer: 'American Heart Association', img: '/images/programs-hq/healthcare-hero.jpg', alt: 'Healthcare and first aid training' },
              { name: 'Rise Up', issuer: 'National Retail Federation Foundation', img: '/images/programs-hq/training-classroom.jpg', alt: 'Students in a professional training classroom' },
            ].map((cred) => (
              <div key={cred.name} className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="relative h-32">
                  <Image
                    src={cred.img}
                    alt={cred.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-900 text-sm mb-1">{cred.name}</p>
                  <p className="text-xs text-gray-500">{cred.issuer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Outcomes */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Career Outcomes</h2>
          <p className="text-gray-600 mb-8">HVAC is a 4-Star Indiana Top Job with strong demand across the state.</p>

          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Job Titles</h3>
              <ul className="space-y-2 text-gray-700">
                <li>HVAC Service Technician</li>
                <li>HVAC Installation Technician</li>
                <li>Maintenance Technician</li>
                <li>Refrigeration Technician</li>
                <li>Building Maintenance Specialist</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Salary Range</h3>
              <p className="text-gray-700 mb-4">
                Entry-level: $18–$22/hour ($38,000–$46,000/year). Experienced technicians with
                additional certifications earn $60,000–$80,000+.
              </p>
              <h3 className="font-bold text-gray-900 mb-3">Employers Hiring</h3>
              <p className="text-gray-700">
                HVAC contractors, property management companies, hospitals, schools, manufacturing
                facilities, and commercial building operators throughout Central Indiana.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Funding Works */}
      <section className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">How Funding Works</h2>
          <p className="text-gray-600 mb-8">Most students pay nothing out of pocket.</p>

          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Step 1: Register at Indiana Career Connect</h3>
              <p className="text-sm text-gray-600">Create a free account at indianacareerconnect.com. This is the state workforce portal. It takes about 10 minutes.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Step 2: Meet with a WorkOne Career Coach</h3>
              <p className="text-sm text-gray-600">Your career coach will determine your eligibility for WIOA or Workforce Ready Grant funding and help you complete the paperwork.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Step 3: Apply to Our Program</h3>
              <p className="text-sm text-gray-600">We coordinate with WorkOne to confirm your enrollment and funding. Once approved, you start training with your cohort.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {[
              { q: 'Do I need any experience to enroll?', a: 'No. This program is built for complete beginners. We start with the basics — what heating and cooling systems are, how they work, and how to work on them safely.' },
              { q: 'How long is the program?', a: '15 weeks (approximately 160 clock hours). That includes 110 hours of classroom instruction and 50 hours of on-the-job training at employer partner sites.' },
              { q: 'How much does it cost?', a: 'If you qualify for WIOA or Workforce Ready Grant funding through WorkOne, your tuition may be fully covered. Self-pay tuition is $5,000 with weekly payment plans available.' },
              { q: 'What certifications do I get?', a: '6 credentials: EPA 608 Universal (required by federal law to handle refrigerants), Residential HVAC 1 & 2, OSHA 30 Safety, CPR/First Aid, and Rise Up.' },
              { q: 'What jobs can I get after this?', a: 'HVAC Service Technician, Installation Specialist, or Maintenance Technician. Starting pay is $18–22/hour ($38K–$46K/year). Experienced technicians earn $60K–$80K+.' },
              { q: 'Can I work while in the program?', a: 'Yes. Flexible scheduling with day and evening options. Online coursework is self-paced. Most students keep their current job while training.' },
              { q: 'What is OJT?', a: 'On-the-Job Training — 50 hours of supervised, hands-on work at an HVAC employer site. You apply classroom skills to real service calls, installations, and maintenance under a licensed technician.' },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-600 leading-relaxed">{faq.a}</p>
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
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Apply for enrollment to begin the process, or submit an inquiry if you have questions first.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/apply/student?program=hvac-technician')}
              className="bg-white text-slate-900 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition cursor-pointer"
            >
              Apply for Enrollment
            </button>
            <button
              onClick={() => router.push('/apply/intake?program=hvac-technician')}
              className="border-2 border-white/30 text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition cursor-pointer"
            >
              Submit an Inquiry
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
