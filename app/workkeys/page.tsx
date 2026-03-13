import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ACT WorkKeys / NCRC | Elevate for Humanity — Indianapolis',
  description: 'Take the ACT WorkKeys assessment and earn the National Career Readiness Certificate (NCRC) at Elevate for Humanity in Indianapolis. Proctored on-site.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/workkeys' },
};

const LEVELS = [
  { level: 'Bronze', desc: 'Demonstrates foundational workplace skills. Recognized by many Indiana employers and workforce programs.', img: '/images/pages/courses-page-7.jpg' },
  { level: 'Silver', desc: 'Mid-level career readiness. Required for many skilled trades and technical roles.', img: '/images/pages/courses-page-8.jpg' },
  { level: 'Gold', desc: 'Advanced workplace skills. Preferred for supervisory, technical, and professional positions.', img: '/images/pages/courses-page-9.jpg' },
  { level: 'Platinum', desc: 'Highest level. Demonstrates exceptional applied math, reading, and locating information skills.', img: '/images/pages/courses-page-10.jpg' },
];

const SUBJECTS = [
  { name: 'Applied Math', desc: 'Workplace math problems — measurements, calculations, and data interpretation.', img: '/images/pages/courses-page-11.jpg' },
  { name: 'Workplace Documents', desc: 'Reading and interpreting workplace materials — forms, charts, graphs, and instructions.', img: '/images/pages/courses-page-12.jpg' },
  { name: 'Business Writing', desc: 'Writing clear, professional workplace communications.', img: '/images/pages/courses-page-13.jpg' },
];

export default function WorkKeysPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[300px] sm:h-[420px] overflow-hidden bg-slate-900">
        <Image src="/images/pages/adult-learner.jpg" alt="ACT WorkKeys career readiness assessment" fill sizes="100vw" className="object-cover opacity-60" priority />
      </section>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Career Readiness Assessment</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-3">ACT WorkKeys / NCRC</h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
            The National Career Readiness Certificate (NCRC) is a portable, employer-recognized credential that proves your workplace skills. Proctored on-site at Elevate for Humanity in Indianapolis.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/testing/book?provider=workkeys" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">
              Schedule Your Test <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/testing" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-5 py-3 rounded-lg transition-colors text-sm">
              Testing Center Overview
            </Link>
          </div>
        </div>
      </div>

      {/* What is WorkKeys */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image src="/images/pages/career-services-page-11.jpg" alt="WorkKeys assessment testing" fill sizes="600px" className="object-cover" />
            </div>
            <div>
              <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">What Is WorkKeys?</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Prove Your Workplace Skills</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                ACT WorkKeys is a job skills assessment system that measures real-world skills employers need. When you pass, you earn the National Career Readiness Certificate (NCRC) — a credential recognized by thousands of employers and required by many Indiana workforce programs.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                The NCRC is also required for some WIOA-funded training programs and is accepted by WorkOne as evidence of career readiness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three subjects */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">The Assessment</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">Three Subject Areas</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {SUBJECTS.map(({ name, desc, img }) => (
              <div key={name} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-44 flex-shrink-0">
                  <Image src={img} alt={name} fill sizes="400px" className="object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-4 py-2">
                    <h3 className="font-bold text-white text-sm">{name}</h3>
                  </div>
                </div>
                <div className="p-4 flex-1 bg-white">
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Four levels */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Credential Levels</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">NCRC Levels</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {LEVELS.map(({ level, desc, img }) => (
              <div key={level} className="rounded-xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-32 flex-shrink-0">
                  <Image src={img} alt={level} fill sizes="300px" className="object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-3 py-1.5">
                    <p className="font-extrabold text-white text-sm">{level}</p>
                  </div>
                </div>
                <div className="p-3 bg-white flex-1">
                  <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-2">Schedule Your Test</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Take WorkKeys at Elevate</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                We proctor ACT WorkKeys on-site at our Indianapolis testing center. Individual and group sessions available. Contact us to schedule.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/testing/book?provider=workkeys" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">
                  Book a Session <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/testing" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
                  Testing Center
                </Link>
              </div>
            </div>
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image src="/images/pages/career-services-page-12.jpg" alt="WorkKeys testing at Elevate" fill sizes="600px" className="object-cover" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
