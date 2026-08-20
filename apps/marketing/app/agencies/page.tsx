import { Metadata } from 'next';
import Image from 'next/image';
import HeroVideo from '@/components/marketing/HeroVideo';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Phone, ShieldCheck, FileCheck2, Clock3, ArrowRight } from 'lucide-react';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'For Workforce Agencies | Elevate Workforce OS',
  description:
    'Workforce and apprenticeship administration with program-specific funding disclosures, auditable progress records, digital credentials, and role-based agency workflows.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/agencies' },
};

const complianceFeatures = [
  {
    image: '/images/pages/government-1.webp',
    alt: 'Registered apprenticeship sponsor administration',
    title: 'Registered Apprenticeship Sponsor',
    description:
      'Elevate maintains a U.S. Department of Labor registration certificate for its apprenticeship sponsor. Program and participant records remain subject to the applicable registered standards.',
    href: '/apprenticeships',
    cta: 'View Apprenticeships',
  },
  {
    image: '/images/pages/government-2.webp',
    alt: 'Program-specific Indiana training provider records',
    title: 'Program-Specific Training Status',
    description:
      'Indiana ETPL, WIOA, and Workforce Ready Grant statements are rendered only when the specific program has a verified regulatory record. Participant authorization is still required.',
    href: '/funding',
    cta: 'Review Funding',
  },
  {
    image: '/images/pages/government-3.webp',
    alt: 'Workforce compliance evidence and reporting workflows',
    title: 'Compliance Evidence Workflows',
    description:
      'Enrollment, attendance, progress, credential, funding, and apprenticeship records can be retained and reviewed through role-based workflows and audit events.',
    href: '/compliance/center',
    cta: 'Compliance Center',
  },
  {
    image: '/images/pages/government-4.webp',
    alt: 'Outcome and intervention records',
    title: 'Outcome & Risk Records',
    description:
      'The platform records learner progress, rule-based risk factors, interventions, credential status, and placement-related data when those workflows are used.',
    href: '/contact',
    cta: 'Request Documentation',
  },
];

const platformFeatures = [
  'Role- and tenant-scoped access controls',
  'Program-specific regulatory evidence records',
  'Digital attendance, progress, and apprenticeship hour workflows',
  'Rule-based learner risk scoring with recorded interventions',
  'Canonical certificate registry with SHA-256 integrity verification',
  'Agency-facing reporting and export support for recorded data',
];

const governanceFeatures = [
  'Server-side authentication and authorization controls',
  'Row-level security for protected Supabase data',
  'Auditable application, enrollment, attendance, and credential events',
  'Program-level funding and regulatory claim controls',
  'Credential revocation-aware public verification',
  'Release gates that block unsupported public claims',
];

export default function AgenciesPage() {
  return (
    <div className="bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Partner Agencies' }]} />
        </div>
      </div>

      <HeroVideo
        videoSrcDesktop="/videos/training-providers-hero.mp4"
        posterImage="/images/pages/agencies-page-1.webp"
        microLabel="For Workforce Agencies"
        analyticsName="agencies"
      >
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-red-600">
          Workforce Agencies &amp; Boards
        </p>
        <h1 className="mb-4 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
          Refer into documented training and apprenticeship workflows.
        </h1>
        <p className="mb-6 max-w-2xl text-base leading-relaxed text-slate-700">
          Elevate supports workforce referrals with program-specific funding disclosures, authorization records,
          attendance and progress tracking, credential evidence, and audit-ready workflow history. Funding and
          eligibility are never represented as guaranteed.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/workone-partner-packet" className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700">
            Workforce Partner Packet
          </Link>
          <Link href="/compliance/center" className="rounded-lg border-2 border-slate-300 px-6 py-3 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50">
            Review Compliance Evidence
          </Link>
        </div>
      </HeroVideo>

      <section className="border-y border-blue-100 bg-blue-50 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-600">Referral workflow</p>
          <h2 className="mb-8 text-xl font-extrabold text-slate-900 sm:text-2xl">Four controlled stages from referral through outcome evidence.</h2>
          <div className="grid gap-6 sm:grid-cols-4">
            {[
              { step: '1', title: 'Eligibility', desc: 'The responsible agency determines participant eligibility and selects an appropriate program.' },
              { step: '2', title: 'Authorization', desc: 'Funding or payment authorization is recorded before the platform treats the enrollment as funded.' },
              { step: '3', title: 'Training & Evidence', desc: 'Attendance, progress, assessments, documents, and applicable OJL/RTI records are captured through canonical workflows.' },
              { step: '4', title: 'Completion & Outcome', desc: 'Completion, credential, intervention, and placement-related evidence is recorded when applicable and available for authorized review.' },
            ].map((item) => (
              <div key={item.step}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-base font-black text-white">{item.step}</div>
                <p className="mb-1 text-sm font-bold text-slate-900">{item.title}</p>
                <p className="text-xs leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">Evidence Before Claims</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {complianceFeatures.map((feature) => (
              <div key={feature.title} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="relative aspect-[16/10] w-full">
                  <Image src={feature.image} alt={feature.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{feature.title}</h3>
                  <p className="flex-1 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                  <Link href={feature.href} className="mt-4 inline-block rounded-lg bg-brand-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-red-700">{feature.cta}</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="mb-6 text-3xl font-bold text-slate-900">Workforce Operating Controls</h2>
            <p className="mb-8 text-slate-600">The platform is designed to retain the evidence behind supported workforce and apprenticeship workflows rather than relying on marketing assertions.</p>
            <ul className="space-y-3">
              {platformFeatures.map((feature) => <li key={feature} className="flex items-start gap-3 text-slate-700"><span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-red-500" />{feature}</li>)}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6"><ShieldCheck className="mb-3 h-9 w-9 text-blue-700" /><div className="font-bold text-slate-900">Access Controlled</div><div className="mt-1 text-sm text-slate-600">Auth, RBAC, tenant and RLS controls</div></div>
            <div className="rounded-xl border border-slate-200 bg-white p-6"><FileCheck2 className="mb-3 h-9 w-9 text-blue-700" /><div className="font-bold text-slate-900">Evidence Backed</div><div className="mt-1 text-sm text-slate-600">Program and credential evidence records</div></div>
            <div className="rounded-xl border border-slate-200 bg-white p-6"><Clock3 className="mb-3 h-9 w-9 text-blue-700" /><div className="font-bold text-slate-900">Time & Progress</div><div className="mt-1 text-sm text-slate-600">Digital attendance and progress workflows</div></div>
            <div className="rounded-xl border border-slate-200 bg-white p-6"><FileCheck2 className="mb-3 h-9 w-9 text-blue-700" /><div className="font-bold text-slate-900">Verifiable</div><div className="mt-1 text-sm text-slate-600">Credential status and SHA-256 integrity checks</div></div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">Governance &amp; Operational Evidence</h2>
          <p className="mx-auto mb-12 max-w-3xl text-center text-slate-600">Controls are evaluated against the implemented system. A workflow is not described as compliant, automated, or verified unless its supporting evidence exists.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {governanceFeatures.map((feature) => <div key={feature} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-5"><span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-red-500" /><span className="text-slate-700">{feature}</span></div>)}
          </div>
          <div className="mt-8 text-center"><Link href="/licenses/enterprise-review" className="font-medium text-brand-blue-600 hover:text-brand-blue-800">Enterprise review evidence →</Link></div>
        </div>
      </section>

      <section className="bg-slate-900 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Review the Platform With Your Agency Requirements</h2>
          <p className="mb-8 text-slate-300">Bring the governing program, reporting, security, and evidence requirements to the review so acceptance can be tested against the actual workflow.</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/store/demos" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-8 py-4 font-bold text-white transition hover:bg-brand-red-700">Schedule Demo <ArrowRight className="h-5 w-5" /></Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-8 py-4 font-bold text-white transition hover:bg-white/10">Contact Us <ArrowRight className="h-5 w-5" /></Link>
            <a href="tel:+13173143757" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-8 py-4 font-bold text-white transition hover:bg-white/10"><Phone className="h-5 w-5" /> (317) 314-3757</a>
          </div>
        </div>
      </section>
    </div>
  );
}
