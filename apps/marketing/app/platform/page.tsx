import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2, ShieldCheck, GraduationCap, FileCheck2, Award, Clock3 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Workforce Infrastructure Platform | Elevate for Humanity',
  description:
    'Multi-role workforce infrastructure for training, apprenticeship, employer, agency, credential, reporting, and compliance-evidence workflows.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform' },
};

const capabilities = [
  {
    icon: ShieldCheck,
    title: 'Access-Controlled Data',
    description:
      'Authentication, server-side authorization, tenant scoping, and Supabase row-level security protect supported administrative, learner, partner, and workforce records.',
  },
  {
    icon: FileCheck2,
    title: 'Program Regulatory Evidence',
    description:
      'ETPL, WIOA, Workforce Ready Grant, and related public statements are controlled at the program level. A funding label is not displayed merely because the organization participates in workforce programs.',
  },
  {
    icon: Clock3,
    title: 'Apprenticeship Time & Progress',
    description:
      'Digital timeclock, approved worksite geofencing, OJL/RTI records, competency verification, wage obligations, supervisor review, and audit events support registered-apprenticeship administration.',
  },
  {
    icon: Award,
    title: 'Credential Registry',
    description:
      'Canonical certificate records support status-aware public verification and SHA-256 issuance-integrity evidence. Third-party certifications remain under the authority of the applicable issuing body.',
  },
  {
    icon: GraduationCap,
    title: 'Learning & Risk Workflows',
    description:
      'Course delivery, assessments, progress, deterministic learner-risk scoring, recorded risk factors, and intervention records support learner monitoring without invented confidence scores.',
  },
  {
    icon: Building2,
    title: 'Agency & Employer Workflows',
    description:
      'Applications, referrals, employer relationships, placement-related records, reporting infrastructure, and evidence exports are available to authorized roles when those workflows are used.',
  },
];

const pipeline = [
  ['01', 'Intake', 'Application, identity, program, funding, and document records.'],
  ['02', 'Training', 'Courses, lessons, assessments, attendance, and apprenticeship records.'],
  ['03', 'Review', 'Risk factors, interventions, competency checks, approvals, and exceptions.'],
  ['04', 'Completion', 'Eligibility checks, completion evidence, credentials, and verification.'],
  ['05', 'Reporting', 'Program, workforce, apprenticeship, credential, and outcome evidence for authorized review.'],
] as const;

export default function PlatformPage() {
  const hero = heroBanners.platform;

  return (
    <div className="bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3"><Breadcrumbs items={[{ label: 'Platform' }]} /></div>
      </div>

      <HeroVideo
        videoSrcDesktop={hero.videoSrcDesktop}
        posterImage={hero.posterImage}
        voiceoverSrc={hero.voiceoverSrc}
        microLabel={hero.microLabel}
        transcript={hero.transcript}
        analyticsName={hero.analyticsName}
      >
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-red-600">Workforce infrastructure</p>
        <h1 className="mb-6 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
          One operating system for training, apprenticeship, credential, and workforce evidence.
        </h1>
        <p className="mb-4 max-w-3xl text-lg leading-relaxed text-slate-700">
          Elevate coordinates public training information with authenticated Admin and LMS workflows backed by canonical Supabase records. The platform is designed so public claims can be traced to implemented controls and evidence rather than duplicated marketing copy.
        </p>
        <p className="mb-8 max-w-3xl text-base leading-relaxed text-slate-600">
          Enterprise acceptance should validate the exact role, program, funding, reporting, security, accessibility, and data requirements that apply to the buyer.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/store/demos" className="inline-flex items-center gap-2 rounded-lg bg-brand-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-red-700">Request Demo <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/licenses/enterprise-review" className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">Enterprise Review</Link>
        </div>
      </HeroVideo>

      <section className="border-b py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-red-600">Implemented capabilities</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Architecture that can be inspected</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm"><Icon className="h-5 w-5 text-brand-red-600" /></div>
                <h3 className="font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-10 text-3xl font-extrabold text-slate-900">Evidence lifecycle</h2>
          <div className="grid gap-6 md:grid-cols-5">
            {pipeline.map(([number, title, description]) => (
              <div key={number} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-black text-brand-red-600">{number}</p>
                <h3 className="mt-2 font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600">Buyer acceptance</p>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">Test the production workflow, not the brochure.</h2>
            <p className="mt-5 leading-relaxed text-slate-600">A government or enterprise review should test tenant isolation, role access, course publication, enrollment, geofenced attendance where applicable, risk/intervention records, completion, credential verification, reporting, audit history, accessibility, and deployment health.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/store/compliance" className="rounded-lg bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800">Compliance Controls</Link>
              <Link href="/contact" className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50">Contact Enterprise Team</Link>
            </div>
          </div>
          <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-slate-200">
            <Image src="/images/pages/platform-page-2.webp" alt="Workforce platform administration" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
        </div>
      </section>
    </div>
  );
}
