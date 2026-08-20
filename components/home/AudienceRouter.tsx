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
    headline: 'Choose a program with a documented training, credential, and enrollment pathway.',
    subtext: 'Program duration, tuition, funding eligibility, and credential requirements are verified at the program level before enrollment.',
    proof: 'Program-specific eligibility and enrollment records',
    cta: 'Check Eligibility',
    ctaHref: '/check-eligibility',
    secondaryCta: 'Browse Programs',
    secondaryHref: '/programs',
    image: '/images/pages/adult-learner.webp',
    color: 'bg-brand-blue-700',
    stats: [
      { value: 'Program', label: 'Specific funding review' },
      { value: 'Agency', label: 'Authorization controls public funding' },
      { value: 'Digital', label: 'Enrollment and progress records' },
    ],
    objections: [
      { q: 'Is funding guaranteed?', a: 'No. Funding depends on the specific program, participant eligibility, available funds, and authorization by the responsible agency.' },
      { q: 'Will I get hired?', a: 'Career services and employer connections may be available, but employment is not guaranteed and outcomes vary by occupation and labor market.' },
      { q: 'How fast can I start?', a: 'Start timing depends on program availability, required documentation, funding or payment clearance, and any prerequisite review.' },
    ],
  },
  {
    id: 'hire',
    icon: Building2,
    label: 'I want to hire',
    headline: 'Review credentialed candidates through documented employer workflows.',
    subtext: 'Credential checks, placement records, and employer participation are managed through the platform when applicable.',
    proof: 'Credential and placement evidence tied to canonical records',
    cta: 'Access Employer Information',
    ctaHref: '/employers',
    secondaryCta: 'Hire Graduates',
    secondaryHref: '/employers/hire-graduates',
    image: '/images/pages/for-employers-page-1.webp',
    color: 'bg-emerald-700',
    stats: [
      { value: 'Verify', label: 'Credential status' },
      { value: 'Track', label: 'Placement records' },
      { value: 'Document', label: 'Employer participation' },
    ],
    objections: [
      { q: 'What screening do you do?', a: 'Screening depends on the program and employer requirement. Credential and skills evidence can be recorded; background or drug screening is only represented when actually required and documented.' },
      { q: 'What guarantees?', a: 'The platform does not guarantee candidate performance, retention, tax credits, reimbursements, or hiring outcomes.' },
      { q: 'How fast can you staff?', a: 'Staffing time depends on qualified candidate availability, employer requirements, and the applicable hiring process.' },
    ],
  },
  {
    id: 'partner',
    icon: Landmark,
    label: "I'm a workforce partner",
    headline: 'Auditable records. Program-specific funding controls. Exportable evidence.',
    subtext: 'The platform supports program, enrollment, credential, attendance, apprenticeship, and compliance workflows with role-based access.',
    proof: 'Evidence-driven compliance and reporting workflows',
    cta: 'View Compliance Center',
    ctaHref: '/compliance/center',
    secondaryCta: 'Partnership Inquiry',
    secondaryHref: '/contact',
    image: '/images/pages/how-it-works-hero.webp',
    color: 'bg-slate-800',
    stats: [
      { value: 'RLS', label: 'Database access controls' },
      { value: 'Audit', label: 'Recorded workflow evidence' },
      { value: 'Export', label: 'Agency-facing reporting support' },
    ],
    objections: [
      { q: 'Are records auditable?', a: 'The platform maintains canonical records and audit controls for supported workflows. Audit readiness still depends on complete, accurate source data and the governing program requirements.' },
      { q: 'What outcomes do you track?', a: 'Supported records include enrollment, progress, credential attainment, attendance, interventions, and placement-related data when those workflows are used.' },
      { q: 'Does the platform guarantee WIOA performance?', a: 'No. The platform supports evidence collection and reporting; it does not guarantee agency performance indicators or participant outcomes.' },
    ],
  },
];

export default function AudienceRouter() {
  const [selected, setSelected] = useState<string | null>(null);
  const audience = AUDIENCES.find((a) => a.id === selected);

  return (
    <section className="relative">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-slate-500">What brings you here?</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {AUDIENCES.map((aud) => {
              const Icon = aud.icon;
              const isActive = selected === aud.id;
              return (
                <button key={aud.id} onClick={() => setSelected(isActive ? null : aud.id)} className={`group relative flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${isActive ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'}`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}><Icon className="h-6 w-6" /></div>
                  <div className="flex-1"><p className="text-lg font-bold">{aud.label}</p><p className={`mt-0.5 text-sm ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{aud.proof}</p></div>
                  <ChevronRight className={`h-5 w-5 text-slate-400 ${isActive ? 'rotate-90' : ''}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {audience && (
        <div className={`${audience.color} text-white`}>
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="mb-6 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">{audience.headline}</h2>
                <p className="mb-8 text-xl text-slate-200">{audience.subtext}</p>
                <div className="mb-10 grid grid-cols-3 gap-6">{audience.stats.map((stat) => <div key={`${stat.value}-${stat.label}`}><p className="text-2xl font-extrabold">{stat.value}</p><p className="mt-1 text-sm text-slate-200">{stat.label}</p></div>)}</div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href={audience.ctaHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-slate-900"><span>{audience.cta}</span><ArrowRight className="h-5 w-5" /></Link>
                  <Link href={audience.secondaryHref} className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 px-8 py-4 font-semibold text-white">{audience.secondaryCta}</Link>
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl"><Image src={audience.image} alt={audience.headline} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" /></div>
                {audience.objections.map((obj) => <div key={obj.q} className="rounded-xl border border-white/10 bg-white/10 p-4"><p className="text-sm font-semibold text-white">{obj.q}</p><p className="mt-1 text-sm text-slate-200">{obj.a}</p></div>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
