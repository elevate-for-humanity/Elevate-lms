'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, GraduationCap, Building2, Landmark, ChevronRight } from 'lucide-react';

const AUDIENCES = [
  {
    id: 'train',
    icon: GraduationCap,
    label: 'I want to train',
    headline: 'Launch a career that pays $35K–$75K in 6–16 weeks.',
    subtext: 'No tuition. No debt. Industry credentials. Employer pipeline.',
    proof: '85% placement rate across all programs',
    cta: 'Check Eligibility in 60 Seconds',
    ctaHref: '/wioa-eligibility',
    secondaryCta: 'Browse Programs',
    secondaryHref: '/programs',
    image: '/images/pages/comp-home-hero-programs.jpg',
    color: 'bg-brand-blue-700',
    accent: 'bg-brand-blue-500',
    stats: [
      { value: '$0', label: 'Tuition for eligible students' },
      { value: '6–16', label: 'Weeks to credential' },
      { value: '85%', label: 'Job placement rate' },
    ],
    objections: [
      { q: 'Is this actually free?', a: 'WIOA, WRG, and JRI can cover tuition, books, and supplies for eligible students. Eligibility varies by program.' },
      { q: 'Will I get hired?', a: 'We connect graduates directly with hiring employers through our career services team. Employment outcomes vary by program and market conditions.' },
      { q: 'How fast can I start?', a: 'Most students begin training within 2–4 weeks of eligibility verification.' },
    ],
  },
  {
    id: 'hire',
    icon: Building2,
    label: 'I want to hire',
    headline: 'Pre-screened, credentialed talent. Ready in weeks, not months.',
    subtext: 'Reduce recruiting cost. Access tax credits. Fill hard-to-staff roles.',
    proof: 'Employers save avg. $12K per hire through WOTC + OJT',
    cta: 'Access Talent Pipeline',
    ctaHref: '/employer',
    secondaryCta: 'View Hiring Programs',
    secondaryHref: '/ojt-and-funding',
    image: '/images/pages/for-employers-page-1.jpg',
    color: 'bg-emerald-700',
    accent: 'bg-emerald-500',
    stats: [
      { value: '$9.6K', label: 'Max WOTC credit per hire' },
      { value: '75%', label: 'OJT wage reimbursement' },
      { value: '2–4', label: 'Weeks to fill roles' },
    ],
    objections: [
      { q: 'What screening do you do?', a: 'Credential verification and skills assessment for all candidates. Background checks and drug screening where required by the program or employer.' },
      { q: 'What guarantees?', a: 'If a hire doesn\'t work out within 90 days, we replace them at no cost.' },
      { q: 'How fast can you staff?', a: 'Active candidate pool. Most roles filled within 2–4 weeks.' },
    ],
  },
  {
    id: 'partner',
    icon: Landmark,
    label: 'I\'m a workforce partner',
    headline: 'Auditable outcomes. Measurable ROI. Compliance-ready infrastructure.',
    subtext: 'ETPL-approved. WIOA/WRG/JRI aligned. Real-time reporting.',
    proof: 'Serving 6 Indiana workforce regions with tracked outcomes',
    cta: 'View Compliance Dashboard',
    ctaHref: '/compliance',
    secondaryCta: 'Partnership Inquiry',
    secondaryHref: '/contact',
    image: '/images/pages/how-it-works-hero.jpg',
    color: 'bg-slate-800',
    accent: 'bg-slate-600',
    stats: [
      { value: '100%', label: 'Audit-ready documentation' },
      { value: 'Real-time', label: 'Outcome tracking' },
      { value: 'ETPL', label: 'Approved provider' },
    ],
    objections: [
      { q: 'Are you auditable?', a: 'Full WIOA compliance tracking, FERPA-compliant data handling, and exportable reports.' },
      { q: 'What outcomes do you track?', a: 'Enrollment, completion, credential attainment, employment, wage gains — all in real-time.' },
      { q: 'Do you boost local metrics?', a: 'Our programs directly improve WIOA performance indicators for your region.' },
    ],
  },
];

export default function AudienceRouter() {
  const [selected, setSelected] = useState<string | null>(null);
  const audience = AUDIENCES.find(a => a.id === selected);

  return (
    <section className="relative">
      {/* Segment selector */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">
            What brings you here?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {AUDIENCES.map((aud) => {
              const Icon = aud.icon;
              const isActive = selected === aud.id;
              return (
                <button
                  key={aud.id}
                  onClick={() => setSelected(isActive ? null : aud.id)}
                  className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 text-left group ${
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.02]'
                      : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400 hover:shadow-md'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'
                  }`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-700'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{aud.label}</p>
                    <p className={`text-sm mt-0.5 ${isActive ? 'text-slate-500' : 'text-slate-500'}`}>
                      {aud.proof}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${isActive ? 'rotate-90 text-slate-400' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tailored experience panel */}
      {audience && (
        <div
          className="overflow-hidden transition-all duration-500 ease-out"
          style={{ maxHeight: '1200px', opacity: 1 }}
        >
          <div className={`${audience.color} text-white`}>
            <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left: messaging */}
                <div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
                    {audience.headline}
                  </h2>
                  <p className="text-xl text-slate-600 mb-8">
                    {audience.subtext}
                  </p>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-6 mb-10">
                    {audience.stats.map((stat, i) => (
                      <div key={i}>
                        <p className="text-3xl font-extrabold">{stat.value}</p>
                        <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href={audience.ctaHref}
                      className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      {audience.cta}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                      href={audience.secondaryHref}
                      className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-all"
                    >
                      {audience.secondaryCta}
                    </Link>
                  </div>
                </div>

                {/* Right: objection neutralizer */}
                <div className="space-y-4">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 shadow-2xl">
                    <Image
                      src={audience.image}
                      alt={audience.headline}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  <div className="space-y-3">
                    {audience.objections.map((obj, i) => (
                      <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <p className="font-semibold text-white/90 text-sm">{obj.q}</p>
                        <p className="text-slate-500 text-sm mt-1">{obj.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
